import { emitRunStartedFx } from "../effects/emit-run-started.effect.js";
import { emitStepPlannedFx } from "../effects/emit-step-planned.effect.js";
import type {
  EffectHandlerDeps,
  EffectHandlerRegistry,
  EmitFlowCompletedFx,
  EmitFlowFailedFx,
  EmitJobHttpJsonSubmittedFx,
  EmitJobMcpSubmittedFx,
  EmitJoinStepStartedFx,
  EmitRunStartedFx,
  EmitStepCompletedFx,
  EmitStepFailedFx,
  EmitStepPlannedFx,
  EmitStepStartedFx,
  WriteContextToDiskFx,
} from "../engine.types.js";

export function wireEffectHandlers(deps: EffectHandlerDeps) {
  return {
    EmitRunStarted: async (effect: EmitRunStartedFx) =>
      emitRunStartedFx(effect, deps),
    EmitStepPlanned: async (effect: EmitStepPlannedFx) =>
      emitStepPlannedFx(effect, deps),
  } satisfies EffectHandlerRegistry;
}
