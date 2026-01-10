import type { FlowAnalysis } from "../flow-analysis/types.js";

type StepId = string;

export type RunContext = FlowContext & {
  runId: string;
  traceId: string;

  input: Record<string, unknown>;
  // global: Record<string, unknown>;  add later

  startedSteps: Record<StepId, boolean>;
  plannedSteps: Record<StepId, boolean>;
  completedSteps: Record<StepId, boolean>;
  failedSteps: Record<StepId, boolean>;
  outstandingSteps: number;

  status: "started" | "completed" | "failed";
  steps: Record<string, StepContext>;

  flowAnalysis: FlowAnalysis;
};

export type StepContext = {
  status: "initialized" | "planned" | "started" | "completed" | "failed";
  reason?: string;
  attempt: number;
  output: Record<StepId, unknown> | null;
  resolved: Record<StepId, unknown>;
};

export type FlowContext = {
  flowId: string;
  flowName: string;
  flowVersion: string;
};
