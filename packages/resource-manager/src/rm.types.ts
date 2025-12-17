import type { JobCompletedParsed, JobFailedParsed } from "@lcase/ports";
import type {
  JobDelayedEvent,
  JobSubmittedEvent,
  WorkerRegisteredData,
  WorkerRegistrationRequestedData,
  WorkerScope,
} from "@lcase/types";
import type { RmState } from "./resource-manager.js";

export type JobSubmittedMsg = {
  type: "JobSubmitted";
  event: JobSubmittedEvent;
};

export type JobCompletedMsg = {
  type: "JobCompleted";
  runId: string;
  parsed: JobCompletedParsed;
};

export type JobFailedMsg = {
  type: "JobFailed";
  runId: string;
  parsed: JobFailedParsed;
};

export type WorkerRegistrationRequestedMsg = {
  type: "WorkerRegistrationRequested";
  data: WorkerRegistrationRequestedData;
};

export type RmMessage =
  | JobSubmittedMsg
  | JobCompletedMsg
  | JobFailedMsg
  | WorkerRegistrationRequestedMsg;

export type QueueJobFx = {
  type: "QueueJob";
  toolId: string;
  event: JobSubmittedEvent | JobDelayedEvent;
};
export type DelayJobFx = {
  type: "DelayJob";
  event: JobSubmittedEvent;
};
export type EmitWorkerRegisteredFx = {
  type: "EmitWorkerRegistered";
  data: WorkerRegisteredData;
  scope: WorkerScope;
};

export type RmEffect = QueueJobFx | DelayJobFx;

export type RmPlanner<M extends RmMessage = RmMessage> = (
  oldState: RmState,
  newState: RmState,
  message: M
) => RmEffect[];

export type RmEffectHandler<T extends RmEffect["type"]> = (
  effect: Extract<RmEffect, { type: T }>
) => void | Promise<void>;

export type RmEffectHandlerRegistry = {
  [T in RmEffect["type"]]?: RmEffectHandler<T>;
};
