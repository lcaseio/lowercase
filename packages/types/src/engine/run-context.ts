import type { FlowAnalysis } from "../flow-analysis/types.js";
import type { ForkSpec } from "./fork-spec.type.js";
import type { RunIndex } from "./run-index.js";

type StepId = string;

export type RunContext = {
  flowId: string;
  flowDefHash: string;

  forkSpecHash?: string;
  forkSpec?: ForkSpec;
  parentRunId?: string;
  runIndex?: RunIndex;

  runId: string;
  traceId: string;

  input: Record<string, unknown>;
  // global: Record<string, unknown>;  add later

  startedSteps: Record<StepId, boolean>;
  plannedSteps: Record<StepId, boolean>;
  completedSteps: Record<StepId, boolean>;
  failedSteps: Record<StepId, boolean>;
  outstandingSteps: number;

  status: "requested" | "started" | "completed" | "failed";
  steps: Record<string, StepContext>;

  flowAnalysis: FlowAnalysis;
};

export type StepContext = {
  status: "initialized" | "planned" | "started" | "completed" | "failed";
  reason?: string;
  attempt: number;
  output: Record<StepId, unknown> | null;
  outputHash: string | null;
  resolved: Record<StepId, unknown>;
};

export type FlowContext = {
  flowId: string;
  flowName: string;
  flowVersion: string;
};
