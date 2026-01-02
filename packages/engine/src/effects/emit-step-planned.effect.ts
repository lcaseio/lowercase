import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitStepPlannedFx,
} from "../engine.types.js";

export const emitStepPlannedFx: EffectHandler<"EmitStepPlanned"> = async (
  effect: EmitStepPlannedFx,
  deps: EffectHandlerDeps
) => {
  const emitter = deps.ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
  await emitter.emit("step.planned", effect.data);
};
