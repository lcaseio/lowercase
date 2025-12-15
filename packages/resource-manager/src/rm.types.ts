import {
  JobCompletedParsed,
  JobDelayedParsed,
  JobFailedParsed,
  JobQueuedParsed,
  JobSubmittedParsed,
} from "@lcase/ports";
import {
  JobSubmittedEvent,
  WorkerRegisteredData,
  WorkerRegistrationRequestedData,
  WorkerScope,
} from "@lcase/types";

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
  runId: string;
  parsed: JobQueuedParsed;
};
export type DelayJobFx = {
  type: "DelayJob";
  runId: string;
  parsed: JobDelayedParsed;
};

export type EmitWorkerRegisteredFx = {
  type: "EmitWorkerRegistered";
  data: WorkerRegisteredData;
  scope: WorkerScope;
};

export type RmEffects = QueueJobFx | DelayJobFx;
