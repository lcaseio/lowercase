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

/**
 * Wires up the effect handlers into an object literal key value methods.
 * Keys are the `type` field in effect objects.
 * Wraps effect handles to provide deps to all functions, but expose a version
 * that only takes an effect after wiring.
 * Used in engine to lookup which effect handlers to execute.
 * @param deps EffectHandlerDeps
 * @returns EffectHandlerRegistry object
 */
export function wireEffectHandlers(deps: EffectHandlerDeps) {
  return {
    EmitRunStarted: async (effect: EmitRunStartedFx) =>
      emitRunStartedFx(effect, deps),
    EmitStepPlanned: async (effect: EmitStepPlannedFx) =>
      emitStepPlannedFx(effect, deps),
  } satisfies EffectHandlerRegistry;
}
