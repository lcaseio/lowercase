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
import { runStartedPlanner } from "../planners/run-started.planner.js";

export const plannerRegistry: PlannerRegistry = {
  FlowSubmitted: flowSubmittedPlanner,
  RunStarted: runStartedPlanner,
};
