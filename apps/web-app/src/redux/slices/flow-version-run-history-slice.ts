import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type FlowVersionRunHistoryState = {
  flowVersionId: string | null;
  flowId: string | null;
  selectedRunId: string | null;
};

const initialState: FlowVersionRunHistoryState = {
  flowVersionId: null,
  flowId: null,
  selectedRunId: null,
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
    },
  },
});

export const { enterFlowVersionRunHistoryScope, setSelectedRunId } =
  flowVersionRunHistorySlice.actions;

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
