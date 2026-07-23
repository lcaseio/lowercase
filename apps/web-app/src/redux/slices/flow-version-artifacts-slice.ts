import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type ArtifactMetadataDraft = {
  label: string;
  share: boolean;
  curatedParamNames: string[];
};

type FlowVersionArtifactsState = {
  flowVersionId: string | null;
  flowId: string | null;
  selectedArtifactHash: string | null;
  // draft holds whichever values are currently authoritative for display,
  // overriding the (possibly not-yet-caught-up) query cache -- populated on
  // Edit, kept (not cleared) after a successful Save so the panel never has
  // to switch data sources at that moment, and only cleared on Cancel or on
  // selecting a different artifact. isEditing is the separate concern of
  // whether the fields/buttons are currently in edit mode.
  draft: ArtifactMetadataDraft | null;
  isEditing: boolean;
};

const initialState: FlowVersionArtifactsState = {
  flowVersionId: null,
  flowId: null,
  selectedArtifactHash: null,
  draft: null,
  isEditing: false,
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
      state.draft = null;
      state.isEditing = false;
    },
    startEditingArtifactMetadata: (
      state,
      action: PayloadAction<ArtifactMetadataDraft>,
    ) => {
      state.draft = action.payload;
      state.isEditing = true;
    },
    updateDraftLabel: (state, action: PayloadAction<string>) => {
      if (!state.draft) return;
      state.draft.label = action.payload;
    },
    setDraftShare: (state, action: PayloadAction<boolean>) => {
      if (!state.draft) return;
      state.draft.share = action.payload;
    },
    toggleDraftParam: (
      state,
      action: PayloadAction<{ paramName: string; checked: boolean }>,
    ) => {
      if (!state.draft) return;
      const { paramName, checked } = action.payload;
      if (checked) {
        if (!state.draft.curatedParamNames.includes(paramName)) {
          state.draft.curatedParamNames.push(paramName);
        }
      } else {
        state.draft.curatedParamNames = state.draft.curatedParamNames.filter(
          (name) => name !== paramName,
        );
      }
    },
    // save succeeded -- exit edit mode but deliberately keep `draft` as the
    // still-correct override, so there's no moment where the panel has to
    // fall back to a query cache that may not have caught up yet
    artifactMetadataSaved: (state) => {
      state.isEditing = false;
    },
    // discard in-progress edits -- exit edit mode AND drop the override, so
    // the panel falls back to whatever the query cache actually has (correct,
    // since nothing was ever sent to the server)
    cancelEditingArtifactMetadata: (state) => {
      state.isEditing = false;
      state.draft = null;
    },
  },
});

export const {
  enterFlowVersionArtifactsScope,
  selectArtifact,
  startEditingArtifactMetadata,
  updateDraftLabel,
  setDraftShare,
  toggleDraftParam,
  artifactMetadataSaved,
  cancelEditingArtifactMetadata,
} = flowVersionArtifactsSlice.actions;

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
