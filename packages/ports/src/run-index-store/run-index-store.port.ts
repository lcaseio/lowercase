import type {
  AnyEvent,
  JobCompletedEvent,
  JobFailedEvent,
  JobSubmittedEvent,
} from "@lcase/types";

export type RunIndex = {
  flowId: string;
  traceId: string;
  flowDefHash: string;
  forkSpecHash?: string;
  parentId?: string;
  startTime: string;
  endTime: string;
  steps: Record<
    string,
    {
      outputHash: string;
      status: string;
      startTime: string;
      endTime: string;
      argsHash?: string;
    }
  >;
};

export interface RunIndexStorePort {
  addRunRequested(event: AnyEvent<"run.requested">): Promise<void>;
  addJobSubmitted(event: JobSubmittedEvent): Promise<void>;
  addJobFinished(event: JobCompletedEvent | JobFailedEvent): Promise<void>;
  addRunStarted(event: AnyEvent<"run.started">): Promise<void>;
  addRunFinished(
    event: AnyEvent<"run.completed"> | AnyEvent<"run.failed">,
  ): Promise<void>;
  addStepStarted(event: AnyEvent<"step.started">): Promise<void>;
  addStepFinished(
    event: AnyEvent<"step.completed"> | AnyEvent<"step.failed">,
  ): Promise<void>;
}
