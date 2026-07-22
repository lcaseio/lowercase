import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type FlowVersionArtifactsState = {
  flowVersionId: string | null;
  flowId: string | null;
  selectedArtifactHash: string | null;
};

const initialState: FlowVersionArtifactsState = {
  flowVersionId: null,
  flowId: null,
  selectedArtifactHash: null,
};

export const flowVersionArtifactsSlice = createSlice({
  name: "flowVersionArtifacts",
  initialState,
  reducers: {
    enterFlowVersionArtifactsScope: (
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
    selectArtifact: (state, action: PayloadAction<string>) => {
      state.selectedArtifactHash = action.payload;
    },
  },
});

export const { enterFlowVersionArtifactsScope, selectArtifact } =
  flowVersionArtifactsSlice.actions;

const EMPTY_FLOW_VERSION_ARTIFACTS_STATE: FlowVersionArtifactsState =
  initialState;

export const selectFlowVersionArtifactsState = (
  state: RootState,
  flowVersionId: string | null,
): FlowVersionArtifactsState => {
  if (state.flowVersionArtifacts.flowVersionId === flowVersionId) {
    return state.flowVersionArtifacts;
  }
  return EMPTY_FLOW_VERSION_ARTIFACTS_STATE;
};
