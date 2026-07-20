import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type {
  FlowVersionRunDetailsTab,
  FlowVersionRunFocusedContent,
  FlowVersionRunMainTab,
} from "@/lib/run-panel-state.types";

type FlowVersionRunHistoryState = {
  flowVersionId: string | null;
  flowId: string | null;
  selectedRunId: string | null;
  activeMainTab: FlowVersionRunMainTab;
  activeDetailsTab: FlowVersionRunDetailsTab;
  selectedEventId: string | null;
  selectedStepId: string | null;
  focusedContent: FlowVersionRunFocusedContent | null;
};

const initialState: FlowVersionRunHistoryState = {
  flowVersionId: null,
  flowId: null,
  selectedRunId: null,
  activeMainTab: "graph",
  activeDetailsTab: "eventDetails",
  selectedEventId: null,
  selectedStepId: null,
  focusedContent: null,
};

export const flowVersionRunHistorySlice = createSlice({
  name: "flowVersionRunHistory",
  initialState,
  reducers: {
    enterFlowVersionRunHistoryScope: (
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
    setSelectedRunId: (state, action: PayloadAction<string | null>) => {
      state.selectedRunId = action.payload;
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
  enterFlowVersionRunHistoryScope,
  setSelectedRunId,
  setActiveMainTab,
  setActiveDetailsTab,
  setSelectedEventId,
  setSelectedStepId,
  setFocusedContent,
} = flowVersionRunHistorySlice.actions;

const EMPTY_FLOW_VERSION_RUN_HISTORY_STATE: FlowVersionRunHistoryState =
  initialState;

export const selectFlowVersionRunHistoryState = (
  state: RootState,
  flowVersionId: string | null,
): FlowVersionRunHistoryState => {
  if (state.flowVersionRunHistory.flowVersionId === flowVersionId) {
    return state.flowVersionRunHistory;
  }
  return EMPTY_FLOW_VERSION_RUN_HISTORY_STATE;
};
