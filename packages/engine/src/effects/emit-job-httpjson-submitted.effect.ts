import { randomUUID } from "crypto";
import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitJobHttpJsonSubmittedFx,
} from "../engine.types.js";

/**
 * Emits a `step.planned` event, used to a stepPlanned
 * reducer + planner + effect combo.
 * @param effect EmitStepPlannedFx
 * @param deps EffectHandlerDeps
 */
export const emitJobHttpJsonSubmittedFx: EffectHandler<
  "EmitJobHttpJsonSubmitted"
> = async (effect: EmitJobHttpJsonSubmittedFx, deps: EffectHandlerDeps) => {
  const emitter = deps.ef.newJobEmitterNewSpan(
    {
      ...effect.scope,
      source: "lowercase://engine",
      jobid: "job-" + String(randomUUID()),
    },
    effect.traceId
  );
  await emitter.emit("job.httpjson.submitted", effect.data);
};
