import type {
  EngineState,
  FlowCompletedMsg,
  FlowFailedMsg,
  FlowSubmittedMsg,
  JobCompletedMsg,
  JobFailedMsg,
  Patch,
  ReducerRegistry,
  StartHttpJsonStepMsg,
  StartJoinMsg,
  StartMcpStepMsg,
  StartParallelMsg,
  StepReadyToStartMsg,
  UpdateJoinMsg,
} from "../engine.types.js";
import { flowSubmittedReducer } from "../reducers/flow-submitted.reducer.js";
import { runStartedReducer } from "../reducers/run-started.reducuer.js";

/**
 * Simple object literal for message `type` fields to reducer functions.
 * Used in engine to pull the correct function for a message type without
 * a switch or if statement.
 */
export const reducerRegistry: ReducerRegistry = {
  FlowSubmitted: flowSubmittedReducer,
  RunStarted: runStartedReducer,
};
