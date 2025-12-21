import { jobFinishedReducer } from "../reducers/job-finished.reducer.js";
import { jobSubmittedReducer } from "../reducers/job-submitted.reducer.js";
import { workerProfileSubmittedReducer } from "../reducers/worker-profile-submitted.reducer.js";
import type { RmReducerRegistry } from "../rm.types.js";

/**
 * Simple flat literal map of message types to reducer functions.
 * Imported directly inside the resource manager, no DI.
 * DI later maybe.
 * @see resource-manager.ts in this package.
 */
export const reducers: RmReducerRegistry = {
  JobSubmitted: jobSubmittedReducer,
  WorkerProfileSubmitted: workerProfileSubmittedReducer,
  JobFinished: jobFinishedReducer,
};
