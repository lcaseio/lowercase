import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type StepId = string;
type FlowId = string;
type SimsState = {
  flowDefHash: string | null;
  flowDef: FlowDefinition | null;
  simId: string | null;
  forkSpec?: ForkSpec | null;
  flowSelectedId: string | null;
  runSelectedId: string | null;
  reusedSteps: Record<FlowId, Record<StepId, true>>;
  newSimName: string | null;
  viewedSimId: string | null;
};
const initialState: SimsState = {
  flowDefHash: null,
  flowDef: null,
  simId: null,
  forkSpec: null,
  flowSelectedId: null,
  runSelectedId: null,
  reusedSteps: {},
  newSimName: null,
  viewedSimId: null,
};

type FlowHash = string;
export const simsSlice = createSlice({
  name: "sims",
  initialState,
  reducers: {
    setSimsFlowHash: (state, action: PayloadAction<FlowHash | null>) => {
      state.flowDefHash = action.payload;
    },
    setFlowDef: (state, action: PayloadAction<FlowDefinition | null>) => {
      state.flowDef = action.payload;
    },
    setSimId: (state, action: PayloadAction<string | null>) => {
      state.simId = action.payload;
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
    setReusedStepIds: (
      state,
      action: PayloadAction<{ flowId: string; reused: string[] }>,
    ) => {
      state.reusedSteps[action.payload.flowId] = {};
      for (const stepId of action.payload.reused) {
        state.reusedSteps[action.payload.flowId][stepId] = true;
      }
    },
    setNewSimName: (state, action: PayloadAction<string | null>) => {
      state.newSimName = action.payload;
    },
    setViewedSimId: (state, action: PayloadAction<string | null>) => {
      state.viewedSimId = action.payload;
    },
    clearReusedSteps: (state) => {
      state.reusedSteps = {};
    },
  },
});

export const {
  setSimsFlowHash,
  setFlowDef,
  setSimId,
  setSimsFlowSelectedId,
  addReusedStepId,
  removeReusedStepId,
  setReusedStepIds,
  setSimsRunSelectedId,
  setNewSimName,
  setViewedSimId,
  clearReusedSteps,
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
