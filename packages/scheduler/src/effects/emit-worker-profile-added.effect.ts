import { SchedulerEffectDeps } from "../registries/effect.registry.js";
import type { EmitWorkerProfileAddedFx } from "../scheduler.types.js";

/**
 * Effect that emits an event to the event bus, letting the worker know
 * that their profile was added to the resource manager.
 *
 * @param effect EmitWorkerProfileAddedFx
 * @param deps RmEffectDeps
 */
export const emitWorkerProfileAdded = async (
  effect: EmitWorkerProfileAddedFx,
  deps: SchedulerEffectDeps
) => {
  console.log("greetings");
  const emitter = deps.ef.newWorkerEmitterNewSpan(effect.scope, effect.traceId);
  await emitter.emit("worker.profile.added", effect.data);
};
