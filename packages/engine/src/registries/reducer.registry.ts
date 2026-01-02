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

export const reducerRegistry: ReducerRegistry = {
  FlowSubmitted: flowSubmittedReducer,
  RunStarted: runStartedReducer,
};
