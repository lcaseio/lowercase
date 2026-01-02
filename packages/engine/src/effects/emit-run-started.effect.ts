import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitRunStartedFx,
} from "../engine.types.js";

export const emitRunStartedFx: EffectHandler<"EmitRunStarted"> = async (
  effect: EmitRunStartedFx,
  deps: EffectHandlerDeps
) => {
  const emitter = deps.ef.newRunEmitterNewSpan({
    ...effect.scope,
    traceid: effect.traceId,
  });

  await emitter.emit("run.started", effect.data);
};
