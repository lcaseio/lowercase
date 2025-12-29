import type {
  CloudEvent,
  EventType,
  EventActions,
  EventDomains,
  EventEntities,
} from "@lcase/types";
import { httpjsonEventTypes } from "./job/httpjson.types.js";
import { mcpEventTypes } from "./job/mcp.types.js";
import { replayEventTypes } from "./replay/replay.types.js";
import { schedulerEventTypes } from "./scheduler/event-types.js";
import { throttlerEventTypes } from "./throttler/event-types.js";

export const eventTypes = [
  ...httpjsonEventTypes,
  ...mcpEventTypes,
  ...replayEventTypes,
  ...schedulerEventTypes,
  ...throttlerEventTypes,
  "flow.queued",
  "flow.submitted",
  "flow.started",
  "flow.completed",
  "flow.failed",
  "engine.started",
  "engine.stopped",
  "run.completed",
  "run.started",
  "run.failed",
  "step.started",
  "step.completed",
  "step.failed",
  "job.mcp.submitted",
  "job.mcp.queued",
  "tool.started",
  "tool.completed",
  "tool.failed",
  "worker.started",
  "worker.stopped",
  "worker.profile.added",
  "worker.profile.submitted",
  "worker.job.dequeued",
  "system.logged",
] as const satisfies readonly EventType[];

// make sure the event types list is complete and not missing any events
type MissingEventTypes = Exclude<EventType, (typeof eventTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
type _ListsAllEventTypes = MissingEventTypes extends never ? true : never;
const _checkEventTypes: _ListsAllEventTypes = true;

// export const stepTypes = [
//   "action",
//   "mcp",
//   undefined,
// ] as const satisfies readonly StepType[];

// make sure the event types list is complete and not missing any events
// type MissingStepTypes = Exclude<StepType, (typeof stepTypes)[number]>;
// utility type not used, just checks provides compile time error if type is missing
// type _ListsAllStepTypes = MissingStepTypes extends never ? true : never;
// const _checkStepTypes: _ListsAllStepTypes = true;

export type CloudEventContext<T extends EventType> = Omit<
  CloudEvent<T>,
  "data"
>;

export const actionTypes = [
  "completed",
  "queued",
  "added",
  "started",
  "completed",
  "stopped",
  "failed",
  "logged",
  "submitted",
  "dequeued",
  "resumed",
  "delayed",
  "granted",
  "denied",
  "requested",
] as const satisfies readonly EventActions[];

export const domainTypes = [
  "flow",
  "run",
  "step",
  "job",
  "tool",
  "engine",
  "worker",
  "system",
  "scheduler",
  "throttler",
] as const satisfies readonly EventDomains[];

export const entityTypes = [
  "mcp",
  "httpjson",
  "job",
] as const satisfies readonly EventEntities[];
