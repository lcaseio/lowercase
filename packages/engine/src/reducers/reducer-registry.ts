import { EngineMessage, Reducer } from "../engine.types.js";
import { flowCompletedReducer } from "./flow-completed.reducer.js";
import { flowFailedReducer } from "./flow-failed.reducer.js";
import { flowSubmittedReducer } from "./flow-submitted.reducer.js";
import { jobCompletedReducer } from "./job-completed.reducer.js";
import { jobFailedReducer } from "./job-failed.reducer.js";
import { startHttpJsonStepReducer } from "./start-httpjson-step.reducer.js";
import { startMcpStepReducer } from "./start-mcp-step.reducer.js";
import { startParallelReducer } from "./start-parallel.reducer.js";
import { stepReadyToStartReducer } from "./step-ready-to-start.reducer.js";

export type ReducerRegistry = {
  [T in EngineMessage["type"]]?: Reducer<Extract<EngineMessage, { type: T }>>;
};

export const reducers = {
  FlowSubmitted: flowSubmittedReducer,
  StepReadyToStart: stepReadyToStartReducer,
  StartParallel: startParallelReducer,
  StartHttpjsonStep: startHttpJsonStepReducer,
  StartMcpStep: startMcpStepReducer,
  JobCompleted: jobCompletedReducer,
  JobFailed: jobFailedReducer,
  FlowCompleted: flowCompletedReducer,
  FlowFailed: flowFailedReducer,
} satisfies ReducerRegistry;
