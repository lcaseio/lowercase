import { Planner, EngineMessage, EngineState } from "../engine.js";
import { flowSubmittedPlanner } from "./flow-submitted.planner.js";
import { jobCompletedPlanner } from "./job-completed.planner.js";
import { startHttpjsonStepPlanner } from "./start-httpjson-step.planner.js";
import { stepReadyToStartPlanner } from "./step-ready-to-start.planner.js";

export type PlannerRegistry = {
  [T in EngineMessage["type"]]?: Planner<Extract<EngineMessage, { type: T }>>;
};

export const planners = {
  FlowSubmitted: flowSubmittedPlanner,
  StepReadyToStart: stepReadyToStartPlanner,
  StartHttpjsonStep: startHttpjsonStepPlanner,
  JobCompleted: jobCompletedPlanner,
} satisfies PlannerRegistry;
