import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type RunnerState = {
  flowHash: string | null;
  flowDef: FlowDefinition | null;
  forkSpecHash: string | null;
  forkSpec?: ForkSpec | null;
  simSelectedId: string | null;
  flowSelectedId: string | null;
  eventGraphRunId: string | null;
  enableSim: boolean;
};
const initialState: RunnerState = {
  flowHash: null,
  flowDef: null,
  forkSpecHash: null,
  forkSpec: null,

  flowSelectedId: null,
  simSelectedId: null,
  eventGraphRunId: null,
  enableSim: false,
};

type FlowHash = string;
export const runSlice = createSlice({
  name: "run",
  initialState,
  reducers: {
    setRunnerFlowHash: (state, action: PayloadAction<FlowHash | null>) => {
      state.flowHash = action.payload;
    },
    setRunnerFlowDef: (state, action: PayloadAction<FlowDefinition | null>) => {
      state.flowDef = action.payload;
    },
    setRunnerFlowSelectedId: (state, action: PayloadAction<string | null>) => {
      state.flowSelectedId = action.payload;
    },
    setEventGraphRunId: (state, action: PayloadAction<string>) => {
      state.eventGraphRunId = action.payload;
    },
    setRunnerSimSelectedId: (state, action: PayloadAction<string>) => {
      state.simSelectedId = action.payload;
    },
  },
});

export const {
  setRunnerFlowHash,
  setRunnerFlowDef,
  setRunnerFlowSelectedId,
  setEventGraphRunId,
  setRunnerSimSelectedId,
} = runSlice.actions;
export const selectFlowHash = (state: RootState) => {
  return state.runner.flowHash;
};

export const selectFlows = (state: RootState) => {
  return state.flows.indexes;
};
export const getEventGraphRunId = (state: RootState) => {
  return state.runner.eventGraphRunId;
};
