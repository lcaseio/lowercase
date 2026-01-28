import { RunContext } from "@lcase/types";

export interface RunOrchestratorPort {
  handleStepOutcome(outcome: StepOutcome, ctx: RunContext): void;
  startRun(ctx: RunContext): void;
}

export type StepOutcome = {
  runId: string;
  stepId: string;
  capId: string;
  status: "success" | "failure";
  jobId: string;
  jobPayload: Record<string, unknown>;
  source: string;
};
