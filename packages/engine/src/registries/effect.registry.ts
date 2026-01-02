import { emitRunStartedFx } from "../effects/emit-run-started.effect.js";
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
  EmitStepStartedFx,
  WriteContextToDiskFx,
} from "../engine.types.js";

export function wireEffectHandlers(deps: EffectHandlerDeps) {
  return {
    EmitRunStarted: async (effect: EmitRunStartedFx) =>
      emitRunStartedFx(effect, deps),
  } satisfies EffectHandlerRegistry;
}
