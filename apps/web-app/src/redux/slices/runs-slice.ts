import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Tab } from "@/components/runs/use-run-details-controller";

type RunState = {
  flowHash: string | null;
  flowDef: FlowDefinition | null;
  forkSpecHash: string | null;
  forkSpec?: ForkSpec | null;
  simSelectedId: string | null;
  flowSelectedId: string | null;
  runId: string | null;
  enableSim: boolean;
  activeTab: Tab;
  selectedEventId: string | null;
};
const initialState: RunState = {
  flowHash: null,
  flowDef: null,
  forkSpecHash: null,
  forkSpec: null,

  flowSelectedId: null,
  simSelectedId: null,
  runId: null,
  enableSim: false,
  activeTab: "flow",

  selectedEventId: null,
};

type FlowHash = string;
export const runsSlice = createSlice({
  name: "runs",
  initialState,
  reducers: {
    setRunsFlowHash: (state, action: PayloadAction<FlowHash | null>) => {
      state.flowHash = action.payload;
    },
    setRunsFlowDef: (state, action: PayloadAction<FlowDefinition | null>) => {
      state.flowDef = action.payload;
    },
    setRunsFlowSelectedId: (state, action: PayloadAction<string | null>) => {
      state.flowSelectedId = action.payload;
    },
    setRunsRunId: (state, action: PayloadAction<string>) => {
      state.runId = action.payload;
    },
    setRunsActiveTab: (state, action: PayloadAction<Tab>) => {
      state.activeTab = action.payload;
    },
    setRunsSelectedEventId: (state, action: PayloadAction<string | null>) => {
      state.selectedEventId = action.payload;
    },
  },
});

export const {
  setRunsFlowHash,
  setRunsFlowDef,
  setRunsFlowSelectedId,
  setRunsRunId,
  setRunsActiveTab,
  setRunsSelectedEventId,
} = runsSlice.actions;
export const getRunsFlowHash = (state: RootState) => {
  return state.runs.flowHash;
};

export const selectFlows = (state: RootState) => {
  return state.flows.indexes;
};
export const getEventGraphRunId = (state: RootState) => {
  return state.runner.eventGraphRunId;
};

export const getRunsSelectedEventId = (state: RootState) => {
  return state.runs.selectedEventId;
};
export const getRunsActiveTab = (state: RootState) => {
  return state.runs.activeTab;
};
