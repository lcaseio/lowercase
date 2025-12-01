import { PipeData } from "../events/shared/pipe.js";
import { FlowDefinition } from "../flow/flow-definition.js";

// marking fields with "move" if they need to move out of Engine context
export type RunContext = {
  runId: string;
  traceId: string; // move

  runningSteps: Set<string>; // move
  queuedSteps: Set<string>; // move
  doneSteps: Set<string>; // move
  outstandingSteps: number; // move

  flowName: string;
  flowId: string;

  inputs: Record<string, unknown>;

  exports: Record<string, unknown>; // move
  globals: Record<string, unknown>; // move
  definition: FlowDefinition;
  status: "started" | "completed" | "failed";

  steps: Record<string, StepContext>;
};

export type StepContext = {
  status: string;
  reason?: string;
  attempt: number;
  exports: Record<string, unknown>;
  result: Record<string, unknown>; // move
  args?: Record<string, unknown>; // move
  pipe?: PipeData;
};
