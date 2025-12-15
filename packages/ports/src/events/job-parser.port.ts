import {
  AnyEvent,
  CapId,
  JobCompletedEvent,
  JobCompletedType,
  JobDelayedEvent,
  JobDelayedType,
  JobEvent,
  JobFailedEvent,
  JobFailedType,
  JobQueuedEvent,
  JobQueuedType,
  JobStartedEvent,
  JobStartedType,
  JobSubmittedEvent,
  JobSubmittedType,
} from "@lcase/types";

/* typed return objects */
export type JobSubmittedParsed = {
  type: JobSubmittedType;
  capId: CapId;
  event: JobSubmittedEvent;
};
export type JobDelayedParsed = {
  type: JobDelayedType;
  capId: string;
  event: JobDelayedEvent;
};
export type JobQueuedParsed = {
  type: JobQueuedType;
  capId: string;
  event: JobQueuedEvent;
};
export type JobStartedParsed = {
  type: JobStartedType;
  capId: string;
  event: JobStartedEvent;
};
export type JobCompletedParsed = {
  type: JobCompletedType;
  capId: string;
  event: JobCompletedEvent;
};
export type JobFailedParsed = {
  type: JobFailedType;
  capId: string;
  event: JobFailedEvent;
};

export interface JobParserPort {
  /* parse types and event envelops */
  parseJobSubmitted(event: AnyEvent): JobSubmittedEvent | undefined;
  parseJobDelayed(event: AnyEvent): JobDelayedParsed | undefined;
  parseJobQueued(event: AnyEvent): JobQueuedParsed | undefined;
  parseJobStarted(event: AnyEvent): JobStartedParsed | undefined;
  parseJobCompleted(event: AnyEvent): JobCompletedParsed | undefined;
  parseJobFailed(event: AnyEvent): JobFailedParsed | undefined;

  /* parse just type strings */
  parseJobSubmittedType(type: string): JobSubmittedType | undefined;
  parseJobDelayedType(type: string): JobDelayedType | undefined;
  parseJobQueuedType(type: string): JobQueuedType | undefined;
  parseJobStartedType(type: string): JobStartedType | undefined;
  parseJobCompletedType(type: string): JobCompletedType | undefined;
  parseJobFailedType(type: string): JobFailedType | undefined;
}
