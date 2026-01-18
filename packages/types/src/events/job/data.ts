import type { Path } from "../../flow-analysis/types.js";
import type { CapId } from "../../flow/map.js";

export type JobDescriptor = {
  job: {
    id: string;
    capid: CapId;
    toolid: string;
  };
};

export type JobStartedData = {
  status: "started";
};

export type JobCompletedData = {
  status: "success";
  output: string | null; // hash value for JSON CAS
  message?: string;
};

export type JobFailedData = {
  status: "failure";
  output: string | null; // hash value for JSON CAS
  message?: string;
};

export type JobDelayedData = {
  reason: string;
};

export type ValueRef = {
  interpolated: boolean;
  valuePath: Path;
  dataPath: Path;
  string: string;
  hash: string | null;
};

export type JobSubmittedData = {
  valueRefs: ValueRef[];
};
export type JobQueuedData = JobSubmittedData;
