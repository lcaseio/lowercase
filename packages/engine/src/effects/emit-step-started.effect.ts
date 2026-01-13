import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitStepStartedFx,
} from "../engine.types.js";

export const emitStepStartedFx: EffectHandler<"EmitStepStarted"> = async (
  effect: EmitStepStartedFx,
  deps: EffectHandlerDeps
) => {
  const emitter = deps.ef.newStepEmitterNewSpan(
    { ...effect.scope },
    effect.traceId
  );

  await emitter.emit("step.started", effect.data);
};
