import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type SimsState = {
  flowHash: string | null;
  flowDef: FlowDefinition | null;
  forkSpecHash: string | null;
  forkSpec?: ForkSpec | null;
  flowSelectedId: string | null;
  eventGraphRunId: string | null;
  reusedSteps: Record<string, true>;
};
const initialState: SimsState = {
  flowHash: null,
  flowDef: null,
  forkSpecHash: null,
  forkSpec: null,
  flowSelectedId: null,
  eventGraphRunId: null,
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
    setEventGraphRunId: (state, action: PayloadAction<string>) => {
      state.eventGraphRunId = action.payload;
    },
    addReusedStepId: (state, action: PayloadAction<string>) => {
      state.reusedSteps[action.payload] = true;
    },
    removeReusedStepId: (state, action: PayloadAction<string>) => {
      delete state.reusedSteps[action.payload];
    },
  },
});

export const {
  setFlowHash,
  setFlowDef,
  setSimsFlowSelectedId,
  setEventGraphRunId,
  addReusedStepId,
  removeReusedStepId,
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
