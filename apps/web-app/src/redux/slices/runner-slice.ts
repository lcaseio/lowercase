import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { Tab } from "@/components/runs/use-run-details-controller";

type RunnerState = {
  flowHash: string | null;
  flowDef: FlowDefinition | null;
  forkSpecHash: string | null;
  forkSpec?: ForkSpec | null;
  simSelectedId: string | null;
  flowSelectedId: string | null;
  eventGraphRunId: string | null;
  enableSim: boolean;
  selectedEventId: string | null;
  activeTab: Tab;
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
  selectedEventId: null,
  activeTab: "flow",
};

type FlowHash = string;
type EventId = string;
export const runnerSlice = createSlice({
  name: "runner",
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
    setRunnerSelectedEventId: (
      state,
      action: PayloadAction<EventId | null>,
    ) => {
      state.selectedEventId = action.payload;
    },
    setRunnerActiveTab: (state, action: PayloadAction<Tab>) => {
      state.activeTab = action.payload;
    },
  },
});

export const {
  setRunnerFlowHash,
  setRunnerFlowDef,
  setRunnerFlowSelectedId,
  setEventGraphRunId,
  setRunnerSimSelectedId,
  setRunnerSelectedEventId,
  setRunnerActiveTab,
} = runnerSlice.actions;
export const selectFlowHash = (state: RootState) => {
  return state.runner.flowHash;
};

export const getRunnerSelectedEventId = (state: RootState) => {
  return state.runner.selectedEventId;
};

export const getRunnerActiveTab = (state: RootState) => {
  return state.runner.activeTab;
};
export const selectFlows = (state: RootState) => {
  return state.flows.indexes;
};
export const getEventGraphRunId = (state: RootState) => {
  return state.runner.eventGraphRunId;
};

export const getRunnerFlowSelectedId = (state: RootState) => {
  return state.runner.flowSelectedId;
};
