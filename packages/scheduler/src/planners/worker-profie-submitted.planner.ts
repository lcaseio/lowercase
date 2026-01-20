import type { SchedulerState } from "../scheduler.state.type.js";
import type {
  EmitWorkerProfileAddedFx,
  SchedulerEffect,
  SchedulerPlanner,
  WorkerProfileSubmittedMsg,
} from "../scheduler.types.js";
/**
 * Currently responds with `worker.registered` when either a worker is added
 * or it already exists.
 * @param oldState RM state before reducer
 * @param newState RM state after reducer
 * @param message  WorkerSubmittedMsg
 * @returns RmEffect
 */
export const workerProfileSubmittedPlanner: SchedulerPlanner<
  WorkerProfileSubmittedMsg
> = (
  oldState: SchedulerState,
  newState: SchedulerState,
  message: WorkerProfileSubmittedMsg
): SchedulerEffect[] => {
  const effects: SchedulerEffect[] = [];

  const oldWorkers = oldState.registry.workers;
  const newWorkers = newState.registry.workers;

  const oldWorkerCount = Object.keys(oldWorkers).length;
  const newWorkerCount = Object.keys(newWorkers).length;

  if (newWorkerCount > oldWorkerCount || newWorkers[message.event.workerid]) {
    // emit registered
    const emitWorkerRegisteredFx = {
      type: "EmitWorkerProfileAdded",
      data: {
        status: "accepted",
        ok: true,
      },
      scope: {
        workerid: message.event.workerid,
        source: "lowercase://rm",
      },
      traceId: message.event.traceid,
    } satisfies EmitWorkerProfileAddedFx;
    effects.push(emitWorkerRegisteredFx);
  }

  return effects;
};
