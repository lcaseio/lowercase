import type { JobEventData, JobEventType, ToolId } from "@lcase/types";

export type JobDescriptor<T extends JobEventType> = {
  id: string;
  isProducer: boolean;
  isConsumer: boolean;
  streamId?: string;
  capability: ToolId;
  key?: string;
  data: JobEventData<T>;
};

// created for each dequeued job; lives until job completes or fails
export type JobContext = {
  jobId: string;
  capability: string;
  startedAt: string;
  flowId: string;
  runId: string;
  stepId: string;
  stepType: string;
  toolId: string;
  workerId: string;
};
