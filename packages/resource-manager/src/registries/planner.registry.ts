import { jobSubmittedPlanner } from "../planners/job-submitted.planner.js";
import { workerProfileSubmittedPlanner } from "../planners/worker-profie-submitted.planner.js";
import { RmPlannerRegistry } from "../rm.types.js";

/**
 * Simple object map for look up planners to execute per message type.
 * Used by the resource manager, imported directly for now.
 * DI in the future if we need to mock this.
 * @see ../resource-manager.ts
 */
export const planners: RmPlannerRegistry = {
  JobSubmitted: jobSubmittedPlanner,
  WorkerProfileSubmitted: workerProfileSubmittedPlanner,
};
