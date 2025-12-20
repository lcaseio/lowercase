import type {
  EmitterFactoryPort,
  JobParserPort,
  QueuePort,
} from "@lcase/ports";
import type {
  EmitWorkerProfileAddedFx,
  QueueJobFx,
  RmEffectHandlerRegistry,
} from "../rm.types.js";
import type { AnyEvent } from "@lcase/types";
import { queueJobEffect } from "../effects/queue-job.effect.js";
import { emitWorkerProfileAdded } from "../effects/emit-worker-profile-added.effect.js";

/**
 * Function used commonly in effects to surface errors in observability.
 * Should probably alter state or do something other than just be visible in the
 * future.  Still in development.
 * @param event AnyEvent that did not emit successfully.
 * @param ef The emitter factory instance used to emit the error.
 * @param message An error messsage (string)
 */
export const emitError = async (
  event: AnyEvent,
  ef: EmitterFactoryPort,
  message: string
): Promise<void> => {
  await ef
    .newSystemEmitterNewSpan({ source: "lowercase://rm" }, event.traceid)
    .emit("system.logged", {
      log: message,
      payload: event,
    });
};
export type EmitErrorFn = typeof emitError;

export type RmEffectDeps = {
  ef: EmitterFactoryPort;
  jobParser: JobParserPort;
  queue: QueuePort;
  emitErrorFn: EmitErrorFn;
};
/**
 * Provide effect handler funcions with dependencies, and groups them in a key
 * value object for easy lookup execution in the resource manager.
 * @param deps Common deps for effect handlers
 * @returns RmEffectHandlerRegistry object.  key by effect type, value is the effect handler.
 */
export function wireEffectHandlers(deps: RmEffectDeps) {
  const handlers = {
    QueueJob: async (effect: QueueJobFx) => queueJobEffect(effect, deps),
    EmitWorkerProfileAdded: async (effect: EmitWorkerProfileAddedFx) =>
      emitWorkerProfileAdded(effect, deps),
  } satisfies RmEffectHandlerRegistry;
  return handlers;
}
