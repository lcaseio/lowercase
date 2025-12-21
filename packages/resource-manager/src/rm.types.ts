import type { JobFailedParsed } from "@lcase/ports";
import type {
  CloudScope,
  JobCompletedEvent,
  JobDelayedEvent,
  JobFailedEvent,
  JobSubmittedEvent,
  WorkerEvent,
  WorkerProfileAddedData,
  WorkerScope,
} from "@lcase/types";
import type { RmState } from "./resource-manager.js";

export type JobSubmittedMsg = {
  type: "JobSubmitted";
  event: JobSubmittedEvent;
};

export type JobFinishedMsg = {
  type: "JobFinished";
  event: JobCompletedEvent | JobFailedEvent;
};

export type JobFailedMsg = {
  type: "JobFailed";
  runId: string;
  parsed: JobFailedParsed;
};

export type WorkerProfileSubmittedMsg = {
  type: "WorkerProfileSubmitted";
  event: WorkerEvent<"worker.profile.submitted">;
};

export type RmMessage =
  | JobSubmittedMsg
  | JobFinishedMsg
  | JobFailedMsg
  | WorkerProfileSubmittedMsg;

export type QueueJobFx = {
  type: "QueueJob";
  toolId: string;
  event: JobSubmittedEvent | JobDelayedEvent;
};
export type DelayJobFx = {
  type: "DelayJob";
  event: JobSubmittedEvent;
};
export type EmitWorkerProfileAddedFx = {
  type: "EmitWorkerProfileAdded";
  data: WorkerProfileAddedData;
  scope: WorkerScope & CloudScope;
  traceId: string;
};

export type RmEffect = QueueJobFx | DelayJobFx | EmitWorkerProfileAddedFx;

export type RmReducer<M extends RmMessage = RmMessage> = (
  state: RmState,
  message: M
) => RmState;

export type RmReducerRegistry = {
  [T in RmMessage["type"]]?: RmReducer<Extract<RmMessage, { type: T }>>;
};

export type RmPlanner<M extends RmMessage = RmMessage> = (
  oldState: RmState,
  newState: RmState,
  message: M
) => RmEffect[];

export type RmPlannerRegistry = {
  [T in RmMessage["type"]]?: RmPlanner<Extract<RmMessage, { type: T }>>;
};

export type RmEffectHandler<T extends RmEffect["type"]> = (
  effect: Extract<RmEffect, { type: T }>
) => void | Promise<void>;

export type RmEffectHandlerRegistry = {
  [T in RmEffect["type"]]?: RmEffectHandler<T>;
};
