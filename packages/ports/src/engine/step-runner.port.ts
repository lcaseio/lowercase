import { RunContext, StepContext } from "@lcase/types";

export interface StepRunnerPort {
  run(context: RunContext, stepId: string): void;
  run(context: RunContext, stepIds: string[]): void;
  initStepContext(stepId: string): StepContext;
}
