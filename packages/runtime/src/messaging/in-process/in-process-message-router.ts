import type { EventType } from "@lcase/types";
import type {
  MessageBinding,
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
import { snapshotMessage } from "./snapshot-message.js";
import { SubscriptionMailbox } from "./subscription-mailbox.js";

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
   * only because handlers await their own resulting publications, keeping the
   * count above zero across a hop.
   */
  whenIdle(): Promise<void>;
}

/**
 * The runtime-private object that resolves a bound publication to its full
 * static set of destination mailboxes. It owns no routing rules of its own --
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
  assertDistinctPublications(config.publications);
  assertDeclaredSubscriptions(config);

  const reportFailure = config.reportFailure ?? defaultReportFailure;
  const publicationsById = new Map(
    config.publications.map((publication) => [publication.id, publication]),
  );
  const declaredSubscriptionIds = new Set(
    config.subscriptions.map((subscription) => subscription.id),
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

  const subscriptionIds = new Set<string>();
  const destinations = new Map<string, SubscriptionMailbox[]>();

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

      // Binding is hosting a declared subscription, never inventing one: the
      // topology is the authority on which consumers are expected to exist,
      // which is what lets seal() name one that nobody wired. Splitting these
      // host bindings from the declarations across *several* processes only
      // becomes meaningful with more than one hosting process.
      if (!declaredSubscriptionIds.has(subscription.id)) {
        throw new Error(
          `[message-router] subscription '${subscription.id}' was not declared in this topology`,
        );
      }
      if (subscriptionIds.has(subscription.id)) {
        throw new Error(
          `[message-router] duplicate subscription id '${subscription.id}'`,
        );
      }
      subscriptionIds.add(subscription.id);

      const mailbox = new SubscriptionMailbox({
        subscriptionId: subscription.id,
        // A handler is contravariant in its Message parameter, so bindings for
        // different publications share no single erased type. The one cast
        // that resolves it sits on the Message at invocation rather than on
        // the binding, leaving subscription and handler shape fully checked.
        // It is sound because of what publish() enforces: a mailbox only ever
        // receives Messages whose type its publication declared -- exactly the
        // Types its handler was written for.
        invoke: (message) =>
          binding.handler(message as MessageOf<Types[number]>),
        maxInFlight: binding.maxInFlight ?? 1,
        reportFailure,
        onSettled,
      });
      const publicationId = subscription.publication.id;
      destinations.set(publicationId, [
        ...(destinations.get(publicationId) ?? []),
        mailbox,
      ]);
    },

    seal(): void {
      if (sealed) throw new Error("[message-router] already sealed");

      // The checks that need the whole picture: a declared subscription
      // nobody bound is a silently broken consumer, and a publication nothing
      // listens to is a topology mistake rather than a quiet no-op delivery.
      assertTopologySealable(config, subscriptionIds);
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

      return {
        async publish(message) {
          if (!sealed) {
            throw new Error(
              `[message-router] cannot publish to '${declared.id}' before seal()`,
            );
          }
          if (!allowedTypes.has(message.type)) {
            throw new Error(
              `[message-router] publication '${declared.id}' does not allow '${message.type}'`,
            );
          }

          // A MessageOf<T> is by construction one of MessageOf<EventType>, but
          // TypeScript cannot verify that for an unresolved T -- the same
          // correlated-generic limitation buildEvent() documents. The check
          // directly above is the real guarantee: this Message's type is one
          // the publication declared.
          const delivered = message as DeliveredMessage;

          // Destinations are looked up now rather than captured when this
          // publisher was resolved, which is what lets a publisher be handed
          // to a component before that component's own handler is bound.
          const mailboxes = destinations.get(declared.id) ?? [];

          // Every snapshot is prepared before any mailbox is touched, so a
          // failure here enqueues nowhere. A partial fanout followed by a
          // publisher retry would produce duplicates that are very hard to
          // account for later.
          const copies = mailboxes.map((mailbox) => ({
            mailbox,
            snapshot: snapshotMessage(delivered),
          }));

          // Counted before publish() resolves, which is what lets a handler
          // awaiting its own downstream publication keep the router from
          // looking idle between hops.
          outstanding += copies.length;
          for (const { mailbox, snapshot } of copies) {
            mailbox.enqueue(snapshot);
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
