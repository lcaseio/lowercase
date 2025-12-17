import type {
  EmitterFactoryPort,
  JobParserPort,
  QueuePort,
} from "@lcase/ports";
import type { QueueJobFx, RmEffectHandlerRegistry } from "../rm.types.js";
import type { AnyEvent, JobQueuedEvent } from "@lcase/types";

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
export type EmitError = typeof emitError;

export function wireEffectHandlers(
  ef: EmitterFactoryPort,
  jobParser: JobParserPort,
  queue: QueuePort,
  emitErrorFn: EmitError = emitError
) {
  const handlers = {
    QueueJob: async (effect: QueueJobFx) => {
      const { event, toolId } = effect;

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
    },
  } satisfies RmEffectHandlerRegistry;
  return handlers;
}
