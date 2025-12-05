import { EngineMessage, Reducer } from "../engine.js";
import { flowSubmittedReducer } from "./flow-submitted.reducer.js";
import { startHttpjsonStepReducer } from "./start-httpjson-step.reducer.js";
import { stepReadyToStartReducer } from "./step-ready-to-start.reducer.js";

export type ReducerRegistry = {
  [T in EngineMessage["type"]]?: Reducer<Extract<EngineMessage, { type: T }>>;
};

export const reducers = {
  FlowSubmitted: flowSubmittedReducer,
  StepReadyToStart: stepReadyToStartReducer,
  StartHttpjsonStep: startHttpjsonStepReducer,
} satisfies ReducerRegistry;
