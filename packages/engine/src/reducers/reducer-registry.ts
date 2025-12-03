import { EngineMessage, Reducer } from "../engine.js";
import { flowSubmittedReducer } from "./flow-submitted.reducer.js";

export type ReducerRegistry = {
  [T in EngineMessage["type"]]?: Reducer<Extract<EngineMessage, { type: T }>>;
};

export const reducers = {
  FlowSubmitted: flowSubmittedReducer,
  StartStep: () => {},
} satisfies ReducerRegistry;
