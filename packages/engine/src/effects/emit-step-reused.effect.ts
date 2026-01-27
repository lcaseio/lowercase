import type { EffectHandler, EffectHandlerDeps } from "../engine.types.js";
import type { EmitStepReusedFx } from "../types/effect.types.js";

/**
 * Emits a `step.reused` event
 * @param effect EmitStepPlannedFx
 * @param deps EffectHandlerDeps
 */
export const emitStepReusedFx: EffectHandler<"EmitStepReused"> = async (
  effect: EmitStepReusedFx,
  deps: EffectHandlerDeps,
) => {
  const emitter = deps.ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
  await emitter.emit("step.reused", effect.data);
};
