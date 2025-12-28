import { jobDelayedReducer } from "../reducers/job-delayed.reducer.js";
import { jobDequeuedReducer } from "../reducers/job-dequeued.reducer.js";
import { jobFinishedReducer } from "../reducers/job-finished.reducer.js";
import { jobQueuedReducer } from "../reducers/job-queued.reducer.js";
import { jobResumedReducer } from "../reducers/job-resumed.reducer.js";
import { jobSubmittedReducer } from "../reducers/job-submitted.reducer.js";
import { workerProfileSubmittedReducer } from "../reducers/worker-profile-submitted.reducer.js";
import type { SchedulerReducerRegistry } from "../scheduler.types.js";

/**
 * Simple flat literal map of message types to reducer functions.
 * Imported directly inside the resource manager, no DI.
 * DI later maybe.
 * @see resource-manager.ts in this package.
 */
export const reducers: SchedulerReducerRegistry = {
  JobSubmitted: jobSubmittedReducer,
  JobDelayed: jobDelayedReducer,
  JobResumed: jobResumedReducer,
  JobQueued: jobQueuedReducer,
  JobDequeued: jobDequeuedReducer,
  JobFinished: jobFinishedReducer,
  WorkerProfileSubmitted: workerProfileSubmittedReducer,
};
