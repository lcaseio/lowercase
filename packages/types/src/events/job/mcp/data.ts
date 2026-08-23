import type { StepMcp } from "../../../flow/mcp.step.js";
import type { JobQueuedData, JobSubmittedData } from "../data.js";

export type JobMcpData = Omit<StepMcp, "type" | "on" | "tool">;
export type JobMcpSubmittedData = JobMcpData & JobSubmittedData;
export type JobMcpQueuedData = JobMcpData & JobQueuedData;
