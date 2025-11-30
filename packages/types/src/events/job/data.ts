import { CapId } from "../../flow/map.js";

export type JobDescriptor = {
  job: {
    id: string;
    capid: CapId;
    toolid: string | null;
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
  result?: Record<string, unknown>;
};

export type JobFailedData = JobDescriptorResolved & {
  status: "failure";
  result?: Record<string, unknown>;
  reason: string;
};

export type JobDelayedData = {
  reason: string;
};
