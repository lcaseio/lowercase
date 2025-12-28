import type { JobDelayedEvent } from "@lcase/types";
import type { DelayJobFx } from "../scheduler.types.js";
import type { SchedulerEffectDeps } from "../registries/effect.registry.js";

/**
 * Emits a `job.${capid}.delayed` event and delayed the same event.
 * Works from a `job.*.submitted` event.
 * Forms the new envelope, parses it, emits, it, then queues it.
 * If parsing fails, emits an error.
 * @param effect The effect information - QueueJobFx object
 * @param deps DI object - RmEffectDeps
 * @returns Promise<void>
 */
export const delayJobEffect = async (
  effect: DelayJobFx,
  deps: SchedulerEffectDeps
) => {
  const { event, toolId } = effect;
  const { jobParser, ef, emitErrorFn, queue } = deps;

  const e = event as unknown as JobDelayedEvent;
  e.type = `job.${event.capid}.delayed`;
  e.toolid = toolId;
  e.data.job.toolid = toolId;
  e.action = "delayed";

  const job = jobParser.parseJobDelayed(e);
  if (!job) {
    await emitErrorFn(event, ef, `Error delaying event ${event.type}`);
    return;
  }
  const emitter = ef.newJobEmitterFromEvent(e, "lowercase://rm");
  const queuedEvent = emitter.formEvent(job.type, job.event.data);
  await queue.enqueue(toolId + "-delayed", queuedEvent);
  await emitter.emitFormedEvent(queuedEvent);
};
