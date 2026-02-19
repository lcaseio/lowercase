import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type StepId = string;
type FlowId = string;
type SimsState = {
  flowHash: string | null;
  flowDef: FlowDefinition | null;
  forkSpecHash: string | null;
  forkSpec?: ForkSpec | null;
  flowSelectedId: string | null;
  runSelectedId: string | null;
  reusedSteps: Record<FlowId, Record<StepId, true>>;
};
const initialState: SimsState = {
  flowHash: null,
  flowDef: null,
  forkSpecHash: null,
  forkSpec: null,
  flowSelectedId: null,
  runSelectedId: null,
  reusedSteps: {},
};

type FlowHash = string;
export const simsSlice = createSlice({
  name: "run",
  initialState,
  reducers: {
    setFlowHash: (state, action: PayloadAction<FlowHash | null>) => {
      state.flowHash = action.payload;
    },
    setFlowDef: (state, action: PayloadAction<FlowDefinition | null>) => {
      state.flowDef = action.payload;
    },
    setSimsFlowSelectedId: (state, action: PayloadAction<string | null>) => {
      state.flowSelectedId = action.payload;
    },
    setSimsRunSelectedId: (state, action: PayloadAction<string | null>) => {
      state.runSelectedId = action.payload;
    },
    addReusedStepId: (
      state,
      action: PayloadAction<{ flowId: string; stepId: string }>,
    ) => {
      state.reusedSteps[action.payload.flowId] ??= {};
      state.reusedSteps[action.payload.flowId][action.payload.stepId] = true;
    },
    removeReusedStepId: (
      state,
      action: PayloadAction<{ flowId: string; stepId: string }>,
    ) => {
      state.reusedSteps[action.payload.flowId] ??= {};
      delete state.reusedSteps[action.payload.flowId][action.payload.stepId];
    },
  },
});

export const {
  setFlowHash,
  setFlowDef,
  setSimsFlowSelectedId,
  addReusedStepId,
  removeReusedStepId,
  setSimsRunSelectedId,
} = simsSlice.actions;

export const selectFlowHash = (state: RootState) => {
  return state.runner.flowHash;
};

export const selectFlows = (state: RootState) => {
  return state.flows.indexes;
};
export const getEventGraphRunId = (state: RootState) => {
  return state.runner.eventGraphRunId;
};

export const selectReusedSteps = (state: RootState) => {
  return state.sims.reusedSteps;
};
