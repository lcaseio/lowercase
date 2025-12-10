import { StepMcp } from "../../../flow/mcp.step.js";
import { PipeDataObject } from "../../shared/pipe.js";
import { JobDescriptor, JobDescriptorResolved } from "../data.js";

export type JobMcpData = JobDescriptor &
  Omit<StepMcp, "pipe" | "type"> &
  PipeDataObject;

export type JobMcpResolvedData = JobDescriptorResolved &
  Omit<StepMcp, "pipe" | "type"> &
  PipeDataObject;
