import { Planner, EngineMessage } from "../engine.types.js";
import { flowFailedPlanner } from "./flow-failed.planner.js";
import { flowSubmittedPlanner } from "./flow-submitted.planner.js";
import { jobCompletedPlanner } from "./job-completed.planner.js";
import { jobFailedPlanner } from "./job-failed.planner.js";
import { startHttpJsonStepPlanner } from "./start-httpjson-step.planner.js";
import { stepReadyToStartPlanner } from "./step-ready-to-start.planner.js";

export type PlannerRegistry = {
  [T in EngineMessage["type"]]?: Planner<Extract<EngineMessage, { type: T }>>;
};

export const planners = {
  FlowSubmitted: flowSubmittedPlanner,
  StepReadyToStart: stepReadyToStartPlanner,
  StartHttpjsonStep: startHttpJsonStepPlanner,
  JobCompleted: jobCompletedPlanner,
  JobFailed: jobFailedPlanner,
  FlowFailed: flowFailedPlanner,
} satisfies PlannerRegistry;
