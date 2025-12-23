import type { EventType } from "./event-map.js";
import type { CloudEvent } from "./shared/cloud-event.js";
import type { FlowScope } from "./flow/event.js";
import type { FlowEventType } from "./flow/map.js";
import type { StepScope } from "./step/event.js";
import type { StepEventType } from "./step/map.js";
import type { EngineEventType } from "./engine/map.js";
import type { EngineScope } from "./engine/event.js";
import type { RunScope, RunEventType } from "./run/index.js";
import type {
  JobCompletedType,
  JobDelayedType,
  JobEventType,
  JobFailedType,
  JobQueuedType,
  JobResumedType,
  JobStartedType,
  JobSubmittedType,
} from "./job/map.js";
import type { JobScope } from "./job/event.js";
import type { ToolEventType } from "./tool/map.js";
import type { ToolScope } from "./tool/event.js";
import type { WorkerEventType } from "./worker/map.js";
import type { WorkerScope } from "./worker/event.js";
import { SystemScope } from "./system/event.js";
import { ReplayEventType } from "./replay/map.js";
import { ReplayScope } from "./replay/event.js";

/**
 * The varying base fields that are required for each event type.
 * @example
 * ScopeFor<"job.mcp.queue"> = {
 *   flowid: string;
 *   jobid: string;
 *   ...
 * }
 */
export type ScopeFor<T extends EventType> = T extends StepEventType
  ? StepScope
  : T extends FlowEventType
  ? FlowScope
  : T extends EngineEventType
  ? EngineScope
  : T extends RunEventType
  ? RunScope
  : T extends JobEventType
  ? JobScope
  : T extends ToolEventType
  ? ToolScope
  : T extends WorkerEventType
  ? WorkerScope
  : T extends ReplayEventType
  ? ReplayScope
  : T extends SystemScope
  ? SystemScope
  : {};

/**
 * Access any event by event type.
 * @example
 * const event: AnyEvent<"job.mcp.queued"> = {
 *   type: "job.mcp.queued",
 *   domain: "job",
 *   entity: "mcp",
 *   action: "queue",
 *   capid: "mcp",
 *   data: { ... },
 * }
 */
export type AnyEvent<T extends EventType = EventType> = CloudEvent<T> &
  ScopeFor<T>;

/* not yet utilized */
export type AnyJobEvent = AnyEvent<JobEventType>;
export type AllJobEvents = AnyEvent<JobEventType>;

/* job category types */
export type JobSubmittedEvent = AnyEvent<JobSubmittedType>;
export type JobQueuedEvent = AnyEvent<JobQueuedType>;
export type JobDelayedEvent = AnyEvent<JobDelayedType>;
export type JobResumedEvent = AnyEvent<JobResumedType>;
export type JobStartedEvent = AnyEvent<JobStartedType>;
export type JobCompletedEvent = AnyEvent<JobCompletedType>;
export type JobFailedEvent = AnyEvent<JobFailedType>;
