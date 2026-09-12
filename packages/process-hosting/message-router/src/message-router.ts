import type { EventType } from "@lcase/types";
import type {
  Subscription,
  MessageBinding,
  MessagePublisher,
  Topic,
  SelectedTopics,
} from "@lcase/ports";

/**
 * The deployment-wide topology a router enforces: every topic anything
 * may publish onto, and every logical subscription expected to consume one.
 *
 * Subscriptions are declared here rather than existing only by being bound,
 * which is what lets `seal()` catch an expected consumer that nobody wired.
 * A topic-level check cannot: one bound sibling satisfies it, so a
 * missing engine terminal binding would seal cleanly and stall every run.
 */
export type MessageRouterTopology = {
  topics: readonly Topic[];
  subscriptions: readonly Subscription[];
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
    topic: Topic<Types>,
  ): MessagePublisher<Types[number]>;
  bind<const Topics extends SelectedTopics>(
    binding: MessageBinding<Topics>,
  ): void;
  seal(): void;
}

export function assertDistinctTopics(topics: readonly Topic[]): void {
  const seen = new Set<string>();
  for (const topic of topics) {
    if (seen.has(topic.id)) {
      throw new Error(`[message-router] duplicate topic id '${topic.id}'`);
    }
    seen.add(topic.id);
  }
}

/**
 * Every subscription must select declared topics, so the two lists
 * describe one graph rather than two that happen to overlap.
 *
 * The empty and duplicate checks are here as well as in the type, because the
 * declaration reaches a carrier through the erased `readonly
 * Subscription[]` form where the non-empty tuple no longer constrains
 * it. Selecting the same topic twice would otherwise register one lane
 * twice and deliver every Message to it twice.
 */
export function assertDeclaredSubscriptions(
  topology: MessageRouterTopology,
): void {
  const topicIds = new Set(topology.topics.map((p) => p.id));
  const seenSubs = new Set<string>();
  for (const subscription of topology.subscriptions) {
    if (seenSubs.has(subscription.id)) {
      throw new Error(
        `[message-router] duplicate subscription id '${subscription.id}'`,
      );
    }
    seenSubs.add(subscription.id);

    if (subscription.topics.length === 0) {
      throw new Error(
        `[message-router] subscription '${subscription.id}' selects no topics`,
      );
    }

    const selectedTopics = new Set<string>();
    for (const topic of subscription.topics) {
      if (selectedTopics.has(topic.id)) {
        throw new Error(
          `[message-router] subscription '${subscription.id}' selects topic '${topic.id}' more than once`,
        );
      }
      selectedTopics.add(topic.id);
      if (!topicIds.has(topic.id)) {
        throw new Error(
          `[message-router] subscription '${subscription.id}' references undeclared topic '${topic.id}'`,
        );
      }
    }
  }
}

/**
 * Resolves the binding's subscription to the topology's own declaration.
 *
 * Both carriers used to authorize a binding by id and then read its routing off
 * the object the caller handed in, so a same-id object selecting somewhere else
 * routed somewhere else. The topology is the authority on what an id means, so
 * routing comes from the declaration and a disagreeing copy is refused rather
 * than quietly honoured. This matters more once an id is what a deployment
 * assigns to a process role.
 */
export function canonicalSubscriptionFor(
  declaredById: ReadonlyMap<string, Subscription>,
  subscription: Subscription,
): Subscription {
  const declared = declaredById.get(subscription.id);
  if (!declared) {
    throw new Error(
      `[message-router] subscription '${subscription.id}' was not declared in this topology`,
    );
  }

  const asked = subscription.topics.map((p) => p.id).join(", ");
  const known = declared.topics.map((p) => p.id).join(", ");
  if (asked !== known) {
    throw new Error(
      `[message-router] subscription '${subscription.id}' selects [${asked}], but this topology declares it as [${known}]`,
    );
  }

  return declared;
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

  const subscribedTopicIds = new Set(
    topology.subscriptions.flatMap((s) => s.topics.map((p) => p.id)),
  );
  for (const topic of topology.topics) {
    if (!subscribedTopicIds.has(topic.id)) {
      throw new Error(
        `[message-router] topic '${topic.id}' has no logical subscriptions`,
      );
    }
  }
}
