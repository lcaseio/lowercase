import type { LogicalSubscription, Publication } from "@lcase/ports";
import { definePublicationFor } from "@lcase/message-router";

/**
 * The HTTP JSON job conversation, declared as delivery purposes rather than
 * transport. Nothing here names a mailbox, a Redis stream key, a consumer
 * name, or an acknowledgement -- a log-backed carrier consumes these same
 * declarations.
 *
 * The two unions are the contract. `definePublicationFor` proves each list
 * covers its union exactly, so adding a terminal type without listing it fails
 * to compile rather than silently never being published.
 */
export type HttpJobCommandType = "job.httpjson.submitted";

export type HttpJobTerminalType =
  "job.httpjson.completed" | "job.httpjson.failed";

export const httpJobCommandPublication =
  definePublicationFor<HttpJobCommandType>()({
    id: "http-job-command.v1",
    types: ["job.httpjson.submitted"],
  });

export const httpJobTerminalPublication =
  definePublicationFor<HttpJobTerminalType>()({
    id: "http-job-terminal.v1",
    types: ["job.httpjson.completed", "job.httpjson.failed"],
  });

type CommandTypes = typeof httpJobCommandPublication.types;
type TerminalTypes = typeof httpJobTerminalPublication.types;

// Four independent subscriptions, each with its own mailbox. Observability
// holds its own on both publications rather than tapping a shared topic, which
// is what makes it a peer subscriber instead of a privileged one.
//
// No wildcard subscription, and deliberately no Limiter subscription: the
// limiter listens only to the dormant worker.slot.* protocol today, and worker
// already owns live local capacity and per-resource permits.
export const workerHttpJobCommandSubscription: LogicalSubscription<CommandTypes> =
  {
    id: "worker.http-job-command.v1",
    publication: httpJobCommandPublication,
  };

export const observabilityHttpJobCommandSubscription: LogicalSubscription<CommandTypes> =
  {
    id: "observability.http-job-command.v1",
    publication: httpJobCommandPublication,
  };

export const engineHttpJobTerminalSubscription: LogicalSubscription<TerminalTypes> =
  {
    id: "engine.http-job-terminal.v1",
    publication: httpJobTerminalPublication,
  };

export const observabilityHttpJobTerminalSubscription: LogicalSubscription<TerminalTypes> =
  {
    id: "observability.http-job-terminal.v1",
    publication: httpJobTerminalPublication,
  };

// The declaration a router is handed, and the one place the graph is stated
// in full. A carrier reads it for more than validation: a log-backed one
// provisions a stream per publication and a consumer group per subscription
// straight from these lists.
export const httpJobPublications: readonly Publication[] = [
  httpJobCommandPublication,
  httpJobTerminalPublication,
];

export const httpJobSubscriptions: readonly LogicalSubscription[] = [
  workerHttpJobCommandSubscription,
  observabilityHttpJobCommandSubscription,
  engineHttpJobTerminalSubscription,
  observabilityHttpJobTerminalSubscription,
];
