import type { WorkerMetadata } from "../../worker/metadata.js";
export type WorkerDescriptorData = {
  worker: {
    id: string;
  };
};

export type WorkerRegisteredData = WorkerDescriptorData & {
  workerId: string;
  status: string;
  registeredAt: string;
};

export type WorkerRegistrationRequestedData = WorkerDescriptorData &
  WorkerMetadata;

export type WorkerStartedData = WorkerDescriptorData & {
  status: "started";
};
export type WorkerStoppedData = WorkerDescriptorData & {
  status: "stopped";
};
