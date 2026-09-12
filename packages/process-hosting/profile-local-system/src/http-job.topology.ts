import type { Subscription, Topic } from "@lcase/ports";
import { defineTopicFor, defineSubscription } from "@lcase/message-router";

/**
 * The HTTP JSON job conversation, declared as delivery purposes rather than
 * transport. Nothing here names a mailbox, a Redis stream key, a consumer
 * name, or an acknowledgement -- a log-backed carrier consumes these same
 * declarations.
 *
 * The two unions are the contract. `defineTopicFor` proves each list
 * covers its union exactly, so adding a terminal type without listing it fails
 * to compile rather than silently never being published.
 */
export type HttpJobCommandType = "job.httpjson.submitted";

export type HttpJobTerminalType =
  "job.httpjson.completed" | "job.httpjson.failed";

export const httpJobCommandTopic = defineTopicFor<HttpJobCommandType>()({
  id: "http-job-command.v1",
  types: ["job.httpjson.submitted"],
});

export const httpJobTerminalTopic = defineTopicFor<HttpJobTerminalType>()({
  id: "http-job-terminal.v1",
  types: ["job.httpjson.completed", "job.httpjson.failed"],
});

// Three independent subscriptions, each with its own delivery lane.
// Observability holds one of its own across both topics rather than receiving a
// privileged wildcard copy, which makes it a peer subscriber instead of a
// special case.
//
// It is one subscription rather than two because recording a Worker job is one
// purpose, not two that happen to be adjacent. Two would give it two lanes, and
// a terminal could then start while the command that produced it was still
// being recorded.
//
// No wildcard subscription, and deliberately no Limiter subscription: the
// limiter listens only to the dormant worker.slot.* protocol today, and worker
// already owns live local capacity and per-resource permits.
export const workerHttpJobCommandSubscription = defineSubscription({
  id: "worker.http-job-command.v1",
  topics: [httpJobCommandTopic],
});

export const engineHttpJobTerminalSubscription = defineSubscription({
  id: "engine.http-job-terminal.v1",
  topics: [httpJobTerminalTopic],
});

export const observabilityHttpJobSubscription = defineSubscription({
  id: "observability.http-job.v1",
  topics: [httpJobCommandTopic, httpJobTerminalTopic],
});

// The declaration a router is handed, and the one place the graph is stated
// in full. A carrier reads it for more than validation: a log-backed one
// provisions a stream per topic, and a consumer group per subscription on
// each stream that subscription selects, straight from these lists.
export const httpJobTopics: readonly Topic[] = [
  httpJobCommandTopic,
  httpJobTerminalTopic,
];

export const httpJobSubscriptions: readonly Subscription[] = [
  workerHttpJobCommandSubscription,
  engineHttpJobTerminalSubscription,
  observabilityHttpJobSubscription,
];
