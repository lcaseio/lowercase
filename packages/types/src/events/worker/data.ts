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
