import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type FlowVersionSimsMode = "browsing" | "authoring";

type FlowVersionSimsState = {
  flowVersionId: string | null;
  flowId: string | null;
  mode: FlowVersionSimsMode;
  selectedRunId: string | null;
};

const initialState: FlowVersionSimsState = {
  flowVersionId: null,
  flowId: null,
  mode: "browsing",
  selectedRunId: null,
};

export const flowVersionSimsSlice = createSlice({
  name: "flowVersionSims",
  initialState,
  reducers: {
    enterFlowVersionSimsScope: (
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
    startCreatingSim: (state) => {
      state.mode = "authoring";
      state.selectedRunId = null;
    },
    selectRunForNewSim: (state, action: PayloadAction<string>) => {
      state.selectedRunId = action.payload;
    },
    cancelCreatingSim: (state) => {
      state.mode = "browsing";
      state.selectedRunId = null;
    },
  },
});

export const {
  enterFlowVersionSimsScope,
  startCreatingSim,
  selectRunForNewSim,
  cancelCreatingSim,
} = flowVersionSimsSlice.actions;

const EMPTY_FLOW_VERSION_SIMS_STATE: FlowVersionSimsState = initialState;

export const selectFlowVersionSimsState = (
  state: RootState,
  flowVersionId: string | null,
): FlowVersionSimsState => {
  if (state.flowVersionSims.flowVersionId === flowVersionId) {
    return state.flowVersionSims;
  }
  return EMPTY_FLOW_VERSION_SIMS_STATE;
};
