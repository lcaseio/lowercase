import { JobResumedEvent } from "@lcase/types";
import { RmEffectDeps } from "../registries/effect.registry.js";
import { ResumeJobFx } from "../rm.types.js";

export const resumeJobEffect = async (
  effect: ResumeJobFx,
  deps: RmEffectDeps
) => {
  const toolId = effect.event.data.job.toolid;

  const { jobParser, ef, emitErrorFn, queue } = deps;
  const delayedJob = await queue.dequeue(toolId + "delayed");

  // later emit a resource manager specific thing to handle state
  // updates correctly on failure
  if (!delayedJob) {
    await emitErrorFn(
      effect.event,
      ef,
      `Error dequeueing delayed job for ${toolId}: event undefined`
    );
    return;
  }
  const job = jobParser.parseJobDelayed(delayedJob);

  if (!job) {
    await emitErrorFn(
      effect.event,
      ef,
      `Error dequeueing delayed job for ${toolId}: event validation failed.`
    );
    return;
  }

  const e = job.event as unknown as JobResumedEvent;

  e.type = `job.${job.event.capid}.resumed`;
  e.toolid = toolId;
  e.data.job.toolid = toolId;
  e.action = "resumed";
  const resumedJob = jobParser.parseJobResumed(e);
  if (!resumedJob) {
    await emitErrorFn(
      e,
      ef,
      `Error parsing job as job.*.resumed for tooldId: ${toolId}`
    );
    return;
  }

  const emitter = ef.newJobEmitterFromEvent(job.event, "lowercase://rm");
  await emitter.emit(e.type, e.data);
};
