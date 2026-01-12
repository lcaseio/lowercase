import { StepMcp } from "../../../flow/mcp.step.js";

export type JobMcpData = Omit<StepMcp, "type" | "on" | "tool">;
