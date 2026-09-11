import type { EventType } from "@lcase/types";
import type {
  LogicalSubscription,
  MessageBinding,
  MessagePublisher,
  Publication,
} from "@lcase/ports";

/**
 * The deployment-wide topology a router enforces: every publication anything
 * may publish onto, and every logical subscription expected to consume one.
 *
 * Subscriptions are declared here rather than existing only by being bound,
 * which is what lets `seal()` catch an expected consumer that nobody wired.
 * A publication-level check cannot: one bound sibling satisfies it, so a
 * missing engine terminal binding would seal cleanly and stall every run.
 */
export type MessageRouterTopology = {
  publications: readonly Publication[];
  subscriptions: readonly LogicalSubscription[];
};

/**
 * What composition needs from a carrier, and the whole of it.
 *
 * Both carriers run the same phases -- declare, resolve publishers, bind,
 * seal -- because the graph is cyclic either way: worker's handler needs the
 * terminal publisher the router hands out, while the router needs worker's
 * handler to route to.
 *
 * Lifecycle is deliberately absent. An in-process router genuinely has
 * nothing to start, while a log-backed one must run read loops, and
 * `managedResource()` already normalizes exactly that difference without
 * either class pretending to the other's shape. `whenIdle()` is likewise
 * absent: it is an in-process diagnostic that no remote carrier can answer
 * honestly.
 */
export interface MessageRouter {
  /**
   * Resolvable before binding: the returned publisher looks its destinations
   * up when it publishes, not when it is created.
   */
  publisher<Types extends readonly EventType[]>(
    publication: Publication<Types>,
  ): MessagePublisher<Types[number]>;
  bind<const Types extends readonly EventType[]>(
    binding: MessageBinding<Types>,
  ): void;
  seal(): void;
}

export function assertDistinctPublications(
  publications: readonly Publication[],
): void {
  const seen = new Set<string>();
  for (const publication of publications) {
    if (seen.has(publication.id)) {
      throw new Error(
        `[message-router] duplicate publication id '${publication.id}'`,
      );
    }
    seen.add(publication.id);
  }
}

/**
 * Every subscription must name a declared publication, so the two lists
 * describe one graph rather than two that happen to overlap.
 */
export function assertDeclaredSubscriptions(
  topology: MessageRouterTopology,
): void {
  const publicationIds = new Set(topology.publications.map((p) => p.id));
  const seen = new Set<string>();
  for (const subscription of topology.subscriptions) {
    if (seen.has(subscription.id)) {
      throw new Error(
        `[message-router] duplicate subscription id '${subscription.id}'`,
      );
    }
    seen.add(subscription.id);
    if (!publicationIds.has(subscription.publication.id)) {
      throw new Error(
        `[message-router] subscription '${subscription.id}' references undeclared publication '${subscription.publication.id}'`,
      );
    }
  }
}

/**
 * The completeness checks `seal()` runs, shared so both carriers refuse the
 * same topologies. Kept separate from binding so the message names what is
 * missing rather than where it was noticed.
 */
export function assertTopologySealable(
  topology: MessageRouterTopology,
  boundSubscriptionIds: ReadonlySet<string>,
): void {
  for (const subscription of topology.subscriptions) {
    if (!boundSubscriptionIds.has(subscription.id)) {
      throw new Error(
        `[message-router] subscription '${subscription.id}' was declared but never bound`,
      );
    }
  }

  const subscribedPublicationIds = new Set(
    topology.subscriptions.map((s) => s.publication.id),
  );
  for (const publication of topology.publications) {
    if (!subscribedPublicationIds.has(publication.id)) {
      throw new Error(
        `[message-router] publication '${publication.id}' has no logical subscriptions`,
      );
    }
  }
}
