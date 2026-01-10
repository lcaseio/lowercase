import { StepMcp } from "../../../flow/mcp.step.js";
import { PipeDataObject } from "../../shared/pipe.js";
import { JobDescriptor, JobDescriptorResolved } from "../data.js";

export type JobMcpData = Omit<StepMcp, "pipe" | "type">;
export type JobMcpResolvedData = Omit<StepMcp, "pipe" | "type">;
