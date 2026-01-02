import {
  EngineEffect,
  EngineState,
  FlowCompletedMsg,
  FlowFailedMsg,
  FlowSubmittedMsg,
  JobCompletedMsg,
  JobFailedMsg,
  PlannerRegistry,
  StartHttpJsonStepMsg,
  StartJoinMsg,
  StartMcpStepMsg,
  StartParallelMsg,
  StepReadyToStartMsg,
  UpdateJoinMsg,
} from "../engine.types.js";
import { flowSubmittedPlanner } from "../planners/flow-submitted.planner.js";

export const plannerRegistry: PlannerRegistry = {
  FlowSubmitted: flowSubmittedPlanner,
  StepReadyToStart: function (
    oldState: EngineState,
    newState: EngineState,
    message: StepReadyToStartMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  StartParallel: function (
    oldState: EngineState,
    newState: EngineState,
    message: StartParallelMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  StartHttpjsonStep: function (
    oldState: EngineState,
    newState: EngineState,
    message: StartHttpJsonStepMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  StartMcpStep: function (
    oldState: EngineState,
    newState: EngineState,
    message: StartMcpStepMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  JobCompleted: function (
    oldState: EngineState,
    newState: EngineState,
    message: JobCompletedMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  JobFailed: function (
    oldState: EngineState,
    newState: EngineState,
    message: JobFailedMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  FlowCompleted: function (
    oldState: EngineState,
    newState: EngineState,
    message: FlowCompletedMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  FlowFailed: function (
    oldState: EngineState,
    newState: EngineState,
    message: FlowFailedMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  StartJoin: function (
    oldState: EngineState,
    newState: EngineState,
    message: StartJoinMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
  UpdateJoin: function (
    oldState: EngineState,
    newState: EngineState,
    message: UpdateJoinMsg
  ): EngineEffect[] | void {
    throw new Error("Function not implemented.");
  },
};
