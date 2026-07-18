import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { MainPanelLanguage } from "@/components/MainPanelTypes";

export type FlowVersionRunMainTab = "graph" | "events" | "focused";
export type FlowVersionRunDetailsTab = "eventDetails" | "stepResults";

export type FlowVersionRunFocusedContent = {
  title: string;
  value: string;
  language: MainPanelLanguage;
};

type FlowVersionRunState = {
  flowVersionId: string | null;
  flowId: string | null;
  runId: string | null;
  runCreatedAt: string | null;
  simSelectedId: string | null;
  selectedParamHashes: Record<string, string>;
  activeMainTab: FlowVersionRunMainTab;
  activeDetailsTab: FlowVersionRunDetailsTab;
  selectedEventId: string | null;
  selectedStepId: string | null;
  focusedContent: FlowVersionRunFocusedContent | null;
};

const initialState: FlowVersionRunState = {
  flowVersionId: null,
  flowId: null,
  runId: null,
  runCreatedAt: null,
  simSelectedId: null,
  selectedParamHashes: {},
  activeMainTab: "graph",
  activeDetailsTab: "eventDetails",
  selectedEventId: null,
  selectedStepId: null,
  focusedContent: null,
};

export const flowVersionRunSlice = createSlice({
  name: "flowVersionRun",
  initialState,
  reducers: {
    enterFlowVersionRunScope: (
      state,
      action: PayloadAction<{ flowVersionId: string; flowId: string }>,
    ) => {
      if (state.flowVersionId === action.payload.flowVersionId) return;
      return {
        ...initialState,
        flowVersionId: action.payload.flowVersionId,
        flowId: action.payload.flowId,
      };
    },
    clearRun: (state) => {
      return {
        ...initialState,
        flowVersionId: state.flowVersionId,
        flowId: state.flowId,
      };
    },
    setParamHash: (
      state,
      action: PayloadAction<{ name: string; hash?: string }>,
    ) => {
      const { name, hash } = action.payload;
      if (!hash) {
        const rest = { ...state.selectedParamHashes };
        delete rest[name];
        state.selectedParamHashes = rest;
        return;
      }
      state.selectedParamHashes[name] = hash;
    },
    setSimSelectedId: (state, action: PayloadAction<string | null>) => {
      state.simSelectedId = action.payload;
    },
    runSubmitted: (state, action: PayloadAction<{ runId: string }>) => {
      state.runId = action.payload.runId;
      state.runCreatedAt = new Date().toISOString();
      state.selectedEventId = null;
      state.selectedStepId = null;
      state.activeDetailsTab = "eventDetails";
    },
    setActiveMainTab: (state, action: PayloadAction<FlowVersionRunMainTab>) => {
      state.activeMainTab = action.payload;
    },
    setActiveDetailsTab: (
      state,
      action: PayloadAction<FlowVersionRunDetailsTab>,
    ) => {
      state.activeDetailsTab = action.payload;
    },
    setSelectedEventId: (state, action: PayloadAction<string | null>) => {
      state.selectedEventId = action.payload;
    },
    setSelectedStepId: (state, action: PayloadAction<string | null>) => {
      state.selectedStepId = action.payload;
    },
    setFocusedContent: (
      state,
      action: PayloadAction<FlowVersionRunFocusedContent>,
    ) => {
      state.focusedContent = action.payload;
      state.activeMainTab = "focused";
    },
  },
});

export const {
  enterFlowVersionRunScope,
  clearRun,
  setParamHash,
  setSimSelectedId,
  runSubmitted,
  setActiveMainTab,
  setActiveDetailsTab,
  setSelectedEventId,
  setSelectedStepId,
  setFocusedContent,
} = flowVersionRunSlice.actions;

const EMPTY_FLOW_VERSION_RUN_STATE: FlowVersionRunState = initialState;

export const selectFlowVersionRunState = (
  state: RootState,
  flowVersionId: string | null,
): FlowVersionRunState => {
  if (state.flowVersionRun.flowVersionId === flowVersionId) {
    return state.flowVersionRun;
  }
  return EMPTY_FLOW_VERSION_RUN_STATE;
};
