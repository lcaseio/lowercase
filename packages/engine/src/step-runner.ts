import type {
  StepHandlerRegistryPort,
  StepRunnerPort,
} from "@lcase/ports/engine";
import { RunContext, StepContext } from "@lcase/types/engine";

export type StepContexts = {
  [runId in string]: {
    [stepId in string]: StepContext;
  };
};

export class StepRunner implements StepRunnerPort {
  #steps: StepContexts = {};
  constructor(private readonly stepHandlerRegistry: StepHandlerRegistryPort) {}

  saveStepContext(runCtx: RunContext, stepCtx: StepContext) {
    runCtx.steps[stepCtx.stepId] = stepCtx;
  }

  initStepContext(stepId: string): StepContext {
    const stepContext = {
      attempt: 0,
      exports: {},
      pipe: {},
      result: {},
      status: "idle",
      stepId,
    };
    return stepContext;
  }

  async run(ctx: RunContext, stepId: string): Promise<void>;
  async run(ctx: RunContext, stepIds: string[]): Promise<void>;

  async run(ctx: RunContext, arg: string | string[]): Promise<void> {
    if (typeof arg === "string") {
      const stepCtx = this.getStepCtx(ctx.runId, arg);
      const handler = this.stepHandlerRegistry[arg];
      const result = handler.handleNew(ctx, this.#steps[ctx.runId], arg);
    }
  }

  getStepCtx(runId: string, stepId: string) {
    const stepCtx = this.#steps[runId][stepId]
      ? this.#steps[runId][stepId]
      : this.initStepContext(stepId);
    this.#steps[runId][stepId] = stepCtx;
    return stepCtx;
  }
}
