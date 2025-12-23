import type { WorkerMetadata } from "../../worker/metadata.js";
export type WorkerDescriptorData = {
  worker: {
    id: string;
  };
};

export type WorkerProfileAddedData = {
  status: "accepted";
  ok: true;
};

export type WorkerProfileSubmittedData = WorkerMetadata;

export type WorkerStartedData = WorkerDescriptorData & {
  status: "started";
};
export type WorkerStoppedData = WorkerDescriptorData & {
  status: "stopped";
};

export type WorkerJobDequeuedData = {
  eventId: string;
  eventType: string;
  spanId: string;
  flowId: string;
  runId: string;
  stepId: string;
  jobId: string;
  capId: string;
  toolId: string;
};
