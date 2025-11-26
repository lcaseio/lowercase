import { StepHttpJson } from "../../flow/http-json.step.js";
import { CapId } from "../../flow/map.js";
import { StepMcp } from "../../flow/mcp.step.js";
import { PipeData, PipeDataObject } from "../shared/pipe.js";

export type JobDescriptor = {
  job: {
    id: string;
    capid: CapId;
    toolid: string | null;
  };
};

export type JobMcpData = JobDescriptor &
  Omit<StepMcp, "pipe" | "type"> &
  PipeDataObject;

export type JobMcpQueuedData = JobMcpData;

export type JobHttpJsonData = JobDescriptor &
  Omit<StepHttpJson, "pipe" | "type"> & {
    pipe: PipeData;
  };

export type JobStartedData = JobDescriptor & {
  status: "started";
};

export type JobCompletedData = JobDescriptor & {
  status: "completed";
  result?: unknown;
};

export type JobFailedData = JobDescriptor & {
  status: "failed";
  result?: unknown;
  reason: string;
};

export type JobQueuedData = JobDescriptor & {
  status: "queued";
};
