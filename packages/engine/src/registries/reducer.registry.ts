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

export const reducerRegistry: ReducerRegistry = {
  FlowSubmitted: flowSubmittedReducer,
  StepReadyToStart: function (
    state: EngineState,
    message: StepReadyToStartMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  StartParallel: function (
    state: EngineState,
    message: StartParallelMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  StartHttpjsonStep: function (
    state: EngineState,
    message: StartHttpJsonStepMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  StartMcpStep: function (
    state: EngineState,
    message: StartMcpStepMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  JobCompleted: function (
    state: EngineState,
    message: JobCompletedMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  JobFailed: function (
    state: EngineState,
    message: JobFailedMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  FlowCompleted: function (
    state: EngineState,
    message: FlowCompletedMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  FlowFailed: function (
    state: EngineState,
    message: FlowFailedMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  StartJoin: function (
    state: EngineState,
    message: StartJoinMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
  UpdateJoin: function (
    state: EngineState,
    message: UpdateJoinMsg
  ): Patch | void {
    throw new Error("Function not implemented.");
  },
};
