import { PipeData } from "../events/shared/pipe.js";
import { FlowDefinition } from "../flow/flow-definition.js";

// marking fields with "move" if they need to move out of Engine context
export type RunContext = FlowContext & {
  runId: string;
  traceId: string; // move

  runningSteps: Set<string>;
  queuedSteps: Set<string>;
  activeJoinSteps: Set<string>;
  doneSteps: Set<string>;
  outstandingSteps: number;

  inputs: Record<string, unknown>;

  exports: Record<string, unknown>;
  globals: Record<string, unknown>;

  status: "started" | "completed" | "failed" | "pending";

  steps: Record<string, StepContext>;
};

export type StepContext = {
  status: "initialized" | "pending" | "started" | "completed" | "failed";
  reason?: string;
  attempt: number;
  exports: Record<string, unknown>;
  result: Record<string, unknown>;
  resolved: Record<string, unknown>;
  args?: Record<string, unknown>;
  pipe?: PipeData;
  stepId: string;
  joins: Set<string>;
};

export type FlowContext = {
  flowId: string;
  flowName: string;
  definition: FlowDefinition;
};
