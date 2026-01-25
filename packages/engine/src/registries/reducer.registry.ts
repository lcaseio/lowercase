import type { ReducerRegistry } from "../engine.types.js";
import { flowDefResultReducer } from "../reducers/flow-def-result.reducer.js";
import { flowSubmittedReducer } from "../reducers/flow-submitted.reducer.js";
import { forkSpecResultReducer } from "../reducers/fork-spec-result.reducer.js";
import { jobFinishedReducer } from "../reducers/job-finished.reducer.js";
import { makeRunPlanReducer } from "../reducers/make-run-plan.reducer.js";
import { runFinishedReducer } from "../reducers/run-finished.reducer.js";
import { runIndexResultReducer } from "../reducers/run-index-result.reducer.js";
import { runRequestedReducer } from "../reducers/run-requested.reducer.js";
import { runStartedReducer } from "../reducers/run-started.reducer.js";
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
  FlowDefResult: flowDefResultReducer,
  ForkSpecResult: forkSpecResultReducer,
  MakeRunPlan: makeRunPlanReducer,
  RunIndexResult: runIndexResultReducer,
  RunRequested: runRequestedReducer,
  RunStarted: runStartedReducer,
  RunFinished: runFinishedReducer,
  StepPlanned: stepPlannedReducer,
  StepStarted: stepStartedReducer,
  StepFinished: stepFinishedReducer,
  JobFinished: jobFinishedReducer,
};
