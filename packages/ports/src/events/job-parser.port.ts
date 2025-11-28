import {
  AnyEvent,
  JobCompletedEvent,
  JobCompletedType,
  JobFailedEvent,
  JobFailedType,
  JobQueuedEvent,
  JobQueuedType,
  JobSubmittedEvent,
  JobSubmittedType,
} from "@lcase/types";

export type JobSubmittedParsed = {
  type: JobSubmittedType;
  capId: string;
  event: JobSubmittedEvent;
};
export type JobQueuedParsed = {
  type: JobQueuedType;
  capId: string;
  event: JobQueuedEvent;
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
  parseJobSubmitted(event: AnyEvent): JobSubmittedParsed | undefined;
  parseJobQueued(event: AnyEvent): JobQueuedParsed | undefined;
  parseJobCompleted(event: AnyEvent): JobCompletedParsed | undefined;
  parseJobFailed(event: AnyEvent): JobFailedParsed | undefined;
}
