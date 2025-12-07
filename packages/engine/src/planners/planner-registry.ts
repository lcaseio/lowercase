import { Planner, EngineMessage } from "../engine.types.js";
import { flowCompletedPlanner } from "./flow-completed.planner.js";
import { flowFailedPlanner } from "./flow-failed.planner.js";
import { flowSubmittedPlanner } from "./flow-submitted.planner.js";
import { jobCompletedPlanner } from "./job-completed.planner.js";
import { jobFailedPlanner } from "./job-failed.planner.js";
import { startHttpJsonStepPlanner } from "./start-httpjson-step.planner.js";
import { stepReadyToStartPlanner } from "./step-ready-to-start.planner.js";
import { starMcpStepPlanner } from "./start-mcp-step.planner.js";
import { startParallelPlanner } from "./start-parallel.planner.js";
import { updateJoinPlanner } from "./update-join.planner.js";

export type PlannerRegistry = {
  [T in EngineMessage["type"]]?: Planner<Extract<EngineMessage, { type: T }>>;
};

export const planners = {
  FlowSubmitted: flowSubmittedPlanner,
  StepReadyToStart: stepReadyToStartPlanner,
  StartParallel: startParallelPlanner,
  UpdateJoin: updateJoinPlanner,
  StartHttpjsonStep: startHttpJsonStepPlanner,
  StartMcpStep: starMcpStepPlanner,
  JobCompleted: jobCompletedPlanner,
  JobFailed: jobFailedPlanner,
  FlowCompleted: flowCompletedPlanner,
  FlowFailed: flowFailedPlanner,
} satisfies PlannerRegistry;
