import {
  RunOrchestratorPort,
  StepOutcome,
  StepRunnerPort,
} from "@lcase/ports/engine";
import { RunContext } from "@lcase/types/engine";
/**
 * Updates run/step state.
 * Applies global policies.
 * Computes next step/action.
 */
export class RunOrchestrator implements RunOrchestratorPort {
  constructor(private readonly stepRunner: StepRunnerPort) {}

  handleStepOutcome(outcome: StepOutcome, ctx: RunContext) {}
  startRun(ctx: RunContext) {
    const startStepId = ctx.definition.start;
    this.stepRunner.run(ctx, startStepId);
  }
}
