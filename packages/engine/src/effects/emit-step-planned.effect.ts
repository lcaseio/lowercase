import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitStepPlannedFx,
} from "../engine.types.js";

/**
 * Emits a `step.planned` event, used to a stepPlanned
 * reducer + planner + effect combo.
 * @param effect EmitStepPlannedFx
 * @param deps EffectHandlerDeps
 */
export const emitStepPlannedFx: EffectHandler<"EmitStepPlanned"> = async (
  effect: EmitStepPlannedFx,
  deps: EffectHandlerDeps
) => {
  const emitter = deps.ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
  await emitter.emit("step.planned", effect.data);
};
