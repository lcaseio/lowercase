import { CapId } from "../../flow/map.js";

export type JobDescriptor = {
  job: {
    id: string;
    capid: CapId;
    toolid: string;
  };
};
export type JobDescriptorResolved = {
  job: {
    id: string;
    capid: CapId;
    toolid: string;
  };
};

export type JobStartedData = JobDescriptor & {
  status: "started";
};

export type JobCompletedData = JobDescriptorResolved & {
  status: "success";
  output: Record<string, unknown> | null;
};

export type JobFailedData = JobDescriptorResolved & {
  status: "failure";
  output: Record<string, unknown> | null;
  reason: string;
};

export type JobDelayedData = {
  reason: string;
};
