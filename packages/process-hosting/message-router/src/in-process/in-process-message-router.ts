import type { EventType } from "@lcase/types";
import type {
  Subscription,
  MessageBinding,
  MessageOf,
  MessagePublisher,
  Topic,
  SelectedTopics,
  SelectedTypes,
} from "@lcase/ports";
import {
  defaultReportFailure,
  type DeliveredMessage,
  type ReportDeliveryFailure,
} from "../delivery.types.js";
import { DeliveryLane } from "../delivery-lane.js";
import {
  assertDeclaredSubscriptions,
  assertDistinctTopics,
} from "@lcase/message-topology";
import {
  assertTopologySealable,
  canonicalSubscriptionFor,
  type MessageRouter,
  type MessageRouterTopology,
} from "../message-router.js";
import { snapshotMessage } from "./snapshot-message.js";

export type InProcessMessageRouterConfig = MessageRouterTopology & {
  reportFailure?: ReportDeliveryFailure;
};

/**
 * Composition runs declare -> resolve publishers -> bind -> seal, and the
 * router is only usable once sealed.
 *
 * The phases exist because the graph is genuinely cyclic: worker's handler
 * needs the terminal publisher, which the router hands out, while the router
 * needs worker's handler to route to it. Resolving publishers before binding
 * breaks that without a mutable component dependency or a service locator.
 *
 * Sealing is one-way. Topology is fixed before any Message moves, and nothing
 * can add a route later -- a component never gets the chance to subscribe to
 * something at runtime.
 */
export interface InProcessMessageRouter extends MessageRouter {
  /**
   * Runtime/test diagnostic: resolves when no delivery is queued or running.
   *
   * This is NOT a drain. It does not stop intake, does not seal the router,
   * does not mean every handler succeeded, and may be followed immediately by
   * new work. It exists so a test can await a multi-hop flow -- which works
   * only because handlers await the Messages they publish in turn, keeping the
   * count above zero across a hop.
   */
  whenIdle(): Promise<void>;
}

/**
 * The runtime-private object that resolves a bound topic to its full
 * static set of destination lanes. It owns no routing rules of its own --
 * runtime's topology supplies them, and they are fixed before any Message
 * moves.
 *
 * Deliberately has no start/stop/drain: the MVP has no graceful shutdown, and
 * naming one would imply a guarantee it does not provide. Process termination
 * may abandon queued and running deliveries.
 */
export function createInProcessMessageRouter(
  config: InProcessMessageRouterConfig,
): InProcessMessageRouter {
  assertDistinctTopics(config.topics);
  assertDeclaredSubscriptions(config);

  const reportFailure = config.reportFailure ?? defaultReportFailure;
  const topicsById = new Map(config.topics.map((topic) => [topic.id, topic]));
  const subscriptionsById = new Map<string, Subscription>(
    config.subscriptions.map((subscription) => [subscription.id, subscription]),
  );

  let outstanding = 0;
  let idleWaiters: (() => void)[] = [];
  let sealed = false;

  const onSettled = (): void => {
    outstanding -= 1;
    if (outstanding > 0) return;
    const waiters = idleWaiters;
    idleWaiters = [];
    for (const resolve of waiters) resolve();
  };

  const boundSubscriptionIds = new Set<string>();
  const destinations = new Map<string, DeliveryLane[]>();

  return {
    bind<const Topics extends SelectedTopics>(
      binding: MessageBinding<Topics>,
    ): void {
      if (sealed) {
        throw new Error(
          `[message-router] cannot bind '${binding.subscription.id}' after seal()`,
        );
      }

      // Binding is hosting a declared subscription, never inventing one: the
      // topology is the authority on which consumers are expected to exist and
      // on what each id selects, which is what lets seal() name one that
      // nobody wired. Splitting these host bindings from the declarations
      // across *several* processes only becomes meaningful with more than one
      // hosting process.
      const subscription = canonicalSubscriptionFor(
        subscriptionsById,
        binding.subscription,
      );
      if (boundSubscriptionIds.has(subscription.id)) {
        throw new Error(
          `[message-router] duplicate subscription id '${subscription.id}'`,
        );
      }
      boundSubscriptionIds.add(subscription.id);

      const lane = new DeliveryLane({
        subscriptionId: subscription.id,
        // A handler is contravariant in its Message parameter, so bindings for
        // different selections share no single erased type. The one cast that
        // resolves it sits on the Message at invocation rather than on the
        // binding, leaving subscription and handler shape fully checked.
        // It is sound because of what publish() enforces: a lane only ever
        // receives Messages whose type one of its selected topics
        // declared -- exactly the union its handler was written for.
        invoke: (message) =>
          binding.handler(message as MessageOf<SelectedTypes<Topics>>),
        maxInFlight: binding.maxInFlight ?? 1,
        reportFailure,
        onSettled,
      });

      // The one lane built above, registered under each selected topic rather
      // than rebuilt per topic. Every selected topic feeds that same queue, so
      // its deliveries interleave in the order they were enqueued instead of
      // racing in separate ones, and `maxInFlight` is one counter over the
      // subscription rather than one per topic. At maxInFlight 1 handlers then
      // start and settle in enqueue order across topics, which is the only
      // ordering a multi-topic subscription gets locally. Separate lanes would
      // let a later Message be handled while an earlier one was still running,
      // even where the earlier one is what caused it.
      //
      // A topic's list still holds several lanes, one per subscription that
      // selected it, which is what keeps Worker and Observability independent
      // recipients of the same Message.
      for (const topic of subscription.topics) {
        destinations.set(topic.id, [
          ...(destinations.get(topic.id) ?? []),
          lane,
        ]);
      }
    },

    seal(): void {
      if (sealed) throw new Error("[message-router] already sealed");

      // The checks that need the whole picture: a declared subscription
      // nobody bound is a silently broken consumer, and a topic nothing
      // listens to is a topology mistake rather than a quiet no-op delivery.
      assertTopologySealable(config, boundSubscriptionIds);
      sealed = true;
    },

    publisher<Types extends readonly EventType[]>(
      topic: Topic<Types>,
    ): MessagePublisher<Types[number]> {
      const declared = topicsById.get(topic.id);
      if (!declared) {
        throw new Error(`[message-router] undeclared topic '${topic.id}'`);
      }

      const allowedTypes = new Set<EventType>(declared.types);

      return {
        async publish(message) {
          if (!sealed) {
            throw new Error(
              `[message-router] cannot publish to '${declared.id}' before seal()`,
            );
          }
          if (!allowedTypes.has(message.type)) {
            throw new Error(
              `[message-router] topic '${declared.id}' does not allow '${message.type}'`,
            );
          }

          // A MessageOf<T> is by construction one of MessageOf<EventType>, but
          // TypeScript cannot verify that for an unresolved T -- the same
          // correlated-generic limitation buildEvent() documents. The check
          // directly above is the real guarantee: this Message's type is one
          // the topic declared.
          const delivered = message as DeliveredMessage;

          // Destinations are looked up now rather than captured when this
          // publisher was resolved, which is what lets a publisher be handed
          // to a component before that component's own handler is bound.
          const lanes = destinations.get(declared.id) ?? [];

          // Every snapshot is prepared before any lane is touched, so a
          // failure here enqueues nowhere. A partial fanout followed by a
          // publisher retry would produce duplicates that are very hard to
          // account for later.
          const copies = lanes.map((lane) => ({
            lane,
            snapshot: snapshotMessage(delivered),
          }));

          // Counted before publish() resolves, which is what lets a handler
          // awaiting the Message it publishes in turn keep the router from
          // looking idle between hops.
          outstanding += copies.length;
          for (const { lane, snapshot } of copies) {
            // Admission is the boundary here, not settlement: a sender never
            // awaits its recipient. The lane's promise is for a carrier that
            // owes its source an outcome, and there is no such source locally.
            void lane.enqueue({ message: snapshot });
          }
        },
      };
    },

    whenIdle(): Promise<void> {
      if (outstanding === 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        idleWaiters.push(resolve);
      });
    },
  };
}
