import type { ReducerRegistry } from "../engine.types.js";
import { flowSubmittedReducer } from "../reducers/flow-submitted.reducer.js";
import { jobFinishedReducer } from "../reducers/job-finished.reducer.js";
import { runFinishedReducer } from "../reducers/run-finished.reducer.js";
import { runStartedReducer } from "../reducers/run-started.reducuer.js";
import { stepFinishedReducer } from "../reducers/step-finished.reducer.js";
import { stepPlannedReducer } from "../reducers/step-planned.reducer.js";
import { stepStartedReducer } from "../reducers/step-started.reducer.js";

/**
 * Simple object literal for message `type` fields to reducer functions.
 * Used in engine to pull the correct function for a message type without
 * a switch or if statement.
 */
export const reducers: ReducerRegistry = {
  FlowSubmitted: flowSubmittedReducer,
  RunStarted: runStartedReducer,
  RunFinished: runFinishedReducer,
  StepPlanned: stepPlannedReducer,
  StepStarted: stepStartedReducer,
  StepFinished: stepFinishedReducer,
  JobFinished: jobFinishedReducer,
};
