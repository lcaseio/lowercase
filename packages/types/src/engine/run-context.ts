import { PipeData } from "../events/shared/pipe.js";
import { FlowDefinition } from "../flow/flow-definition.js";

// marking fields with "move" if they need to move out of Engine context
export type RunContext = FlowContext & {
  runId: string;
  traceId: string; // move

  runningSteps: Set<string>; // move
  queuedSteps: Set<string>; // move
  doneSteps: Set<string>; // move
  outstandingSteps: number; // move

  inputs: Record<string, unknown>;

  exports: Record<string, unknown>; // move
  globals: Record<string, unknown>; // move

  status: "started" | "completed" | "failed" | "pending";

  steps: Record<string, StepContext>;
};

export type StepContext = {
  status: "initialized" | "pending" | "started" | "completed" | "failed";
  reason?: string;
  attempt: number;
  exports: Record<string, unknown>;
  result: Record<string, unknown>; // move
  args?: Record<string, unknown>; // move
  pipe?: PipeData;
  stepId: string;
};

export type FlowContext = {
  flowId: string;
  flowName: string;
  definition: FlowDefinition;
};

const a = new Set();
