import type { AnyEvent, EventType } from "@lcase/types";
import type {
  LogicalSubscription,
  MessageBinding,
  MessageLogPort,
  MessageOf,
  MessagePublisher,
  Publication,
} from "@lcase/ports";
import {
  defaultReportFailure,
  type DeliveredMessage,
  type ReportDeliveryFailure,
} from "../delivery.types.js";
import {
  assertDeclaredSubscriptions,
  assertDistinctPublications,
  assertTopologySealable,
  type MessageRouter,
  type MessageRouterTopology,
} from "../message-router.js";

export type RedisMessageRouterConfig = MessageRouterTopology & {
  /**
   * One connection per call. A blocking `XREADGROUP` occupies its connection
   * for the whole BLOCK window, so a read loop sharing a client with the
   * publisher would stall every `XADD` behind it.
   */
  createLog: () => Promise<MessageLogPort>;
  /** Namespaces every stream key, so a test run cannot collide with dev data. */
  keyPrefix?: string;
  consumerName?: string;
  blockMs?: number;
  readFailureBackoffMs?: number;
  reportFailure?: ReportDeliveryFailure;
};

export interface RedisMessageRouter extends MessageRouter {
  /**
   * Provisions streams and consumer groups, then runs one read loop per bound
   * subscription. Nothing is delivered and nothing may be published until this
   * resolves.
   */
  start(): Promise<void>;
  /**
   * Stops intake and waits for in-flight handlers, then closes every
   * connection. Anything still queued in Redis is simply left unread -- this
   * is not a drain.
   */
  stop(): Promise<void>;
}

type BoundSubscription = {
  subscription: LogicalSubscription;
  handler: (message: DeliveredMessage) => Promise<void>;
  maxInFlight: number;
  stream: string;
  group: string;
  allowedTypes: ReadonlySet<EventType>;
  log?: MessageLogPort;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A log-backed carrier for the same declarations the in-process router
 * consumes, mapping them onto Redis Streams with nothing invented in between:
 * a publication is a stream, a logical subscription is a consumer group, and a
 * hosting process is one consumer within each group. Fan-out across groups is
 * what reproduces "every subscription independently receives every Message";
 * load balancing within a group is what a second hosting process would get.
 *
 * Delivery is deliberately at-most-once, matching the in-process mailbox
 * rather than exceeding it. Every entry is acknowledged once its handler
 * settles, success or failure, so a failed handler is reported and dropped
 * exactly as it is locally. Nothing is retried, nothing is reclaimed, and the
 * pending list stays transient. A process that dies mid-handler loses that
 * Message -- the same outcome the in-process carrier already has, which is
 * what makes swapping one for the other a swap rather than a change.
 */
export function createRedisMessageRouter(
  config: RedisMessageRouterConfig,
): RedisMessageRouter {
  assertDistinctPublications(config.publications);
  assertDeclaredSubscriptions(config);

  const keyPrefix = config.keyPrefix ?? "lcase:";
  // Stable rather than per-boot: with every entry acknowledged there is no
  // pending backlog for a restarted process to inherit, so a fresh consumer
  // name per boot would only accumulate dead consumers in Redis.
  const consumerName = config.consumerName ?? "local";
  const blockMs = config.blockMs ?? 1_000;
  const readFailureBackoffMs = config.readFailureBackoffMs ?? 1_000;
  const reportFailure = config.reportFailure ?? defaultReportFailure;

  const streamFor = (publicationId: string): string =>
    `${keyPrefix}${publicationId}`;

  const publicationsById = new Map(
    config.publications.map((publication) => [publication.id, publication]),
  );
  const declaredSubscriptionIds = new Set(
    config.subscriptions.map((subscription) => subscription.id),
  );

  const bindings = new Map<string, BoundSubscription>();
  let sealed = false;
  let running = false;
  let publisherLog: MessageLogPort | undefined;
  let loops: Promise<void>[] = [];

  function report(
    subscriptionId: string,
    entryId: string,
    message: AnyEvent | null,
    error: unknown,
  ): void {
    try {
      reportFailure({
        subscriptionId,
        messageId: message?.id ?? entryId,
        messageType: message?.type ?? ("unknown" as EventType),
        source: message?.source ?? "unknown",
        error,
      });
    } catch {
      // A failing reporter must never take a read loop down with it.
    }
  }

  async function deliver(
    bound: BoundSubscription,
    entry: { id: string; message: AnyEvent },
  ): Promise<void> {
    const decoded: AnyEvent | null = entry.message ?? null;
    try {
      // Nothing validated this envelope on the way in. The in-process router's
      // handler cast is sound only because publish() checked the type against
      // the publication first; off the wire that guarantee has to be
      // re-established here or the cast below is a lie.
      if (!decoded || !bound.allowedTypes.has(decoded.type)) {
        report(
          bound.subscription.id,
          entry.id,
          decoded,
          new Error(
            `[message-router] stream '${bound.stream}' carried '${String(
              decoded?.type,
            )}', which publication '${bound.subscription.publication.id}' does not declare`,
          ),
        );
        return;
      }
      await bound.handler(decoded as DeliveredMessage);
    } catch (error) {
      report(bound.subscription.id, entry.id, decoded, error);
    } finally {
      try {
        await bound.log?.ack(bound.stream, bound.group, [entry.id]);
      } catch (error) {
        report(bound.subscription.id, entry.id, decoded, error);
      }
    }
  }

  async function runLoop(bound: BoundSubscription): Promise<void> {
    const log = bound.log;
    if (!log) return;

    while (running) {
      let entries;
      try {
        entries = await log.readGroup(bound.stream, bound.group, consumerName, {
          batchSize: bound.maxInFlight,
          blockMs,
        });
      } catch (error) {
        // A connection dropped mid-shutdown is expected, not a fault.
        if (!running) return;
        report(bound.subscription.id, "", null, error);
        await sleep(readFailureBackoffMs);
        continue;
      }

      // The batch is awaited as a whole before the next read, so one slow
      // handler idles this subscription's remaining lanes. The in-process
      // mailbox refills continuously; this is a throughput difference between
      // the carriers, not a semantic one.
      await Promise.all(entries.map((entry) => deliver(bound, entry)));
    }
  }

  return {
    bind<const Types extends readonly EventType[]>(
      binding: MessageBinding<Types>,
    ): void {
      const { subscription } = binding;
      if (sealed) {
        throw new Error(
          `[message-router] cannot bind '${subscription.id}' after seal()`,
        );
      }
      if (!declaredSubscriptionIds.has(subscription.id)) {
        throw new Error(
          `[message-router] subscription '${subscription.id}' was not declared in this topology`,
        );
      }
      if (bindings.has(subscription.id)) {
        throw new Error(
          `[message-router] duplicate subscription id '${subscription.id}'`,
        );
      }

      bindings.set(subscription.id, {
        subscription,
        // Same contravariance as the in-process router: one cast on the
        // Message at invocation, sound because deliver() has just checked the
        // decoded type against the publication's declared list.
        handler: (message) =>
          binding.handler(message as MessageOf<Types[number]>),
        maxInFlight: binding.maxInFlight ?? 1,
        stream: streamFor(subscription.publication.id),
        group: subscription.id,
        allowedTypes: new Set<EventType>(subscription.publication.types),
      });
    },

    seal(): void {
      if (sealed) throw new Error("[message-router] already sealed");
      assertTopologySealable(config, new Set(bindings.keys()));
      sealed = true;
    },

    publisher<Types extends readonly EventType[]>(
      publication: Publication<Types>,
    ): MessagePublisher<Types[number]> {
      const declared = publicationsById.get(publication.id);
      if (!declared) {
        throw new Error(
          `[message-router] undeclared publication '${publication.id}'`,
        );
      }

      const allowedTypes = new Set<EventType>(declared.types);
      const stream = streamFor(declared.id);

      return {
        async publish(message) {
          if (!sealed) {
            throw new Error(
              `[message-router] cannot publish to '${declared.id}' before seal()`,
            );
          }
          // Unlike the in-process carrier there is no connection until
          // start(), so publishing early cannot silently reach nobody.
          if (!publisherLog) {
            throw new Error(
              `[message-router] cannot publish to '${declared.id}' before start()`,
            );
          }
          if (!allowedTypes.has(message.type)) {
            throw new Error(
              `[message-router] publication '${declared.id}' does not allow '${message.type}'`,
            );
          }

          await publisherLog.publish(stream, message as AnyEvent);
        },
      };
    },

    async start(): Promise<void> {
      if (!sealed) {
        throw new Error("[message-router] cannot start() before seal()");
      }
      if (running) throw new Error("[message-router] already started");

      publisherLog = await config.createLog();
      for (const publication of config.publications) {
        await publisherLog.ensureStream(streamFor(publication.id));
      }

      // Every group exists before any loop runs and before publishing is
      // possible at all. A group created at `$` sees nothing published before
      // it existed, so provisioning has to complete up front rather than
      // lazily inside each loop.
      for (const bound of bindings.values()) {
        bound.log = await config.createLog();
        await bound.log.ensureConsumerGroup(bound.stream, bound.group, {
          startAt: "latest",
        });
      }

      running = true;
      loops = [...bindings.values()].map((bound) => runLoop(bound));
    },

    async stop(): Promise<void> {
      if (!running) return;
      running = false;

      // Loops are awaited before anything closes: a blocking read returns
      // within one blockMs, and closing its connection underneath it would
      // turn an ordinary shutdown into a reported failure.
      await Promise.all(loops);
      loops = [];

      const logs = [publisherLog, ...[...bindings.values()].map((b) => b.log)];
      publisherLog = undefined;
      for (const bound of bindings.values()) bound.log = undefined;

      await Promise.all(
        logs.map(async (log) => {
          try {
            await log?.close();
          } catch (error) {
            report("router", "", null, error);
          }
        }),
      );
    },
  };
}
