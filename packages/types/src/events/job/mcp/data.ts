import { StepMcp } from "../../../flow/mcp.step.js";
import { JobQueuedData, JobSubmittedData } from "../data.js";

export type JobMcpData = Omit<StepMcp, "type" | "on" | "tool">;
export type JobMcpSubmittedData = JobMcpData & JobSubmittedData;
export type JobMcpQueuedData = JobMcpData & JobQueuedData;
