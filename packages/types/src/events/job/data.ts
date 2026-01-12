import { CapId } from "../../flow/map.js";

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
  output: Record<string, unknown> | null;
  message?: string;
};

export type JobFailedData = {
  status: "failure";
  output: Record<string, unknown> | null;
  message?: string;
};

export type JobDelayedData = {
  reason: string;
};
