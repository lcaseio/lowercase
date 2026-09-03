import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitJobHttpJsonSubmittedFx,
} from "../engine.types.js";

/**
 * Publishes the job.httpjson.submitted event for observability/replay,
 * using the canonical envelope (including jobid) the planner already built.
 * @param effect EmitJobHttpJsonSubmittedFx
 * @param deps EffectHandlerDeps
 */
export const emitJobHttpJsonSubmittedFx: EffectHandler<
  "EmitJobHttpJsonSubmitted"
> = async (effect: EmitJobHttpJsonSubmittedFx, deps: EffectHandlerDeps) => {
  const emitter = deps.ef.newJobEmitterNewSpan(
    {
      ...effect.scope,
      source: "lowercase://engine",
    },
    effect.traceId,
  );
  await emitter.emit("job.httpjson.submitted", effect.data);
};
