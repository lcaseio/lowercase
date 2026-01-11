import type { PlannerRegistry } from "../engine.types.js";
import { flowSubmittedPlanner } from "../planners/flow-submitted.planner.js";
import { runStartedPlanner } from "../planners/run-started.planner.js";

/**
 * Simple object literal for mapping message `type` fields to planner functions.
 * Used in engine to pull the correct function for a message type.
 */
export const plannerRegistry: PlannerRegistry = {
  FlowSubmitted: flowSubmittedPlanner,
  RunStarted: runStartedPlanner,
};
