import type { PipeData } from "../events/shared/pipe.js";
import { FlowAnalysis } from "../flow-analysis/types.js";
import type { FlowDefinition } from "../flow/flow-definition.js";

// marking fields with "move" if they need to move out of Engine context

type StepId = string;
export type RunContext = FlowContext & {
  runId: string;
  traceId: string;

  inputs: Record<string, unknown>;
  exports: Record<string, unknown>;
  globals: Record<string, unknown>;

  startedSteps: Record<StepId, boolean>;
  plannedSteps: Record<StepId, boolean>;
  completedSteps: Record<StepId, boolean>;
  failedSteps: Record<StepId, boolean>;
  activeJoinSteps: Record<StepId, boolean>;
  outstandingSteps: number;

  status: "started" | "completed" | "failed";
  steps: Record<string, StepContext>;

  flowAnalysis: FlowAnalysis;
};

export type StepContext = {
  status: "initialized" | "planned" | "started" | "completed" | "failed";
  reason?: string;
  attempt: number;
  exports: Record<string, unknown>;
  result: Record<string, unknown>;
  resolved: Record<string, unknown>;
  args?: Record<string, unknown>;
  pipe?: PipeData;
  stepId: string;
  joins: Record<StepId, boolean>;
};

export type FlowContext = {
  flowId: string;
  flowName: string;
  flowVersion: string;
};
