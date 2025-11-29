import { CapId } from "../../flow/map.js";
import { StepMcp } from "../../flow/mcp.step.js";
import { PipeDataObject } from "../shared/pipe.js";

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
  status: "completed";
  result?: unknown;
};

export type JobFailedData = JobDescriptorResolved & {
  status: "failed";
  result?: unknown;
  reason: string;
};

export type JobDelayedData = {
  reason: string;
};
