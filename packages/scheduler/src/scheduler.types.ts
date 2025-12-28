import type {
  CloudScope,
  JobCompletedEvent,
  JobDelayedEvent,
  JobFailedEvent,
  JobQueuedEvent,
  JobResumedEvent,
  JobSubmittedEvent,
  WorkerEvent,
  WorkerProfileAddedData,
  WorkerScope,
} from "@lcase/types";
import type { SchedulerState } from "./scheduler.state.type.js";

export type JobSubmittedMsg = {
  type: "JobSubmitted";
  event: JobSubmittedEvent;
};

export type JobQueuedMsg = {
  type: "JobQueued";
  event: JobQueuedEvent;
};

export type JobDelayedMsg = {
  type: "JobDelayed";
  event: JobDelayedEvent;
};

export type JobDequeuedMsg = {
  type: "JobDequeued";
  event: WorkerEvent<"worker.job.dequeued">;
};

export type JobResumedMsg = {
  type: "JobResumed";
  event: JobResumedEvent;
};

export type JobFinishedMsg = {
  type: "JobFinished";
  event: JobCompletedEvent | JobFailedEvent;
};

export type WorkerProfileSubmittedMsg = {
  type: "WorkerProfileSubmitted";
  event: WorkerEvent<"worker.profile.submitted">;
};

export type SchedulerMessage =
  | JobSubmittedMsg
  | JobQueuedMsg
  | JobDelayedMsg
  | JobResumedMsg
  | JobDequeuedMsg
  | JobFinishedMsg
  | WorkerProfileSubmittedMsg;

export type QueueJobFx = {
  type: "QueueJob";
  toolId: string;
  event: JobSubmittedEvent | JobResumedEvent;
};
export type DelayJobFx = {
  type: "DelayJob";
  toolId: string;
  event: JobSubmittedEvent;
};

export type ResumeJobFx = {
  type: "ResumeJob";
  event: JobCompletedEvent | JobFailedEvent;
};

export type EmitWorkerProfileAddedFx = {
  type: "EmitWorkerProfileAdded";
  data: WorkerProfileAddedData;
  scope: WorkerScope & CloudScope;
  traceId: string;
};

export type SchedulerEffect =
  | QueueJobFx
  | DelayJobFx
  | ResumeJobFx
  | EmitWorkerProfileAddedFx;

export type SchedulerReducer<M extends SchedulerMessage = SchedulerMessage> = (
  state: SchedulerState,
  message: M
) => SchedulerState;

export type SchedulerReducerRegistry = {
  [T in SchedulerMessage["type"]]?: SchedulerReducer<
    Extract<SchedulerMessage, { type: T }>
  >;
};

export type SchedulerPlanner<M extends SchedulerMessage = SchedulerMessage> = (
  oldState: SchedulerState,
  newState: SchedulerState,
  message: M
) => SchedulerEffect[];

export type SchedulerPlannerRegistry = {
  [T in SchedulerMessage["type"]]?: SchedulerPlanner<
    Extract<SchedulerMessage, { type: T }>
  >;
};

export type SchedulerEffectHandler<T extends SchedulerEffect["type"]> = (
  effect: Extract<SchedulerEffect, { type: T }>
) => void | Promise<void>;

export type SchedulerEffectHandlerRegistry = {
  [T in SchedulerEffect["type"]]?: SchedulerEffectHandler<T>;
};
