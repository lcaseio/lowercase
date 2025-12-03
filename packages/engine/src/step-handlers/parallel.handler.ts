import { StepParallel } from "@lcase/types";

import type { RunContext } from "@lcase/types/engine";

export class ParallelHandler {
  async handle(
    step: StepParallel,
    ctx: RunContext,
    stepId: string
  ): Promise<void> {
    // go through each step
    // try to start it?

    const { steps } = step;
    for (const step of steps) {
    }
  }
}
