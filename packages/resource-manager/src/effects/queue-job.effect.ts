import type { JobQueuedEvent } from "@lcase/types";
import type { QueueJobFx } from "../rm.types.js";
import type { RmEffectDeps } from "../registries/effect.registry.js";

/**
 * Emits a `job.${capid}.queued` event and queues the same event.
 * Works from a `submitted` or `delayed` job event.
 * Forms the new envelope, parses it, emits, it, then queues it.
 * If parsing fails, emits an error.
 * @param effect The effect information - QueueJobFx object
 * @param deps DI object - RmEffectDeps
 * @returns Promise<void>
 */
export const queueJobEffect = async (
  effect: QueueJobFx,
  deps: RmEffectDeps
) => {
  const { event, toolId } = effect;
  const { jobParser, ef, emitErrorFn, queue } = deps;

  const e = event as unknown as JobQueuedEvent;
  e.type = `job.${event.capid}.queued`;
  e.toolid = toolId;
  e.data.job.toolid = toolId;
  e.action = "queued";

  const job = jobParser.parseJobQueued(e);
  if (!job) {
    await emitErrorFn(event, ef, `Error queueing event ${event.type}`);
    return;
  }
  const emitter = ef.newJobEmitterFromEvent(e, "lowercase://rm");
  const queuedEvent = await emitter.emit(job.type, job.event.data);
  await queue.enqueue(toolId, queuedEvent);
};
