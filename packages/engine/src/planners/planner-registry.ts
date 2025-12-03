import { EffectPlanner, EngineMessage, EngineState } from "../engine.js";
import { flowSubmittedPlanner } from "./flow-submitted.planner.js";

export type PlannerRegistry = {
  [T in EngineMessage["type"]]?: EffectPlanner<
    Extract<EngineMessage, { type: T }>
  >;
};

export const planners = {
  FlowSubmitted: flowSubmittedPlanner,
} satisfies PlannerRegistry;
