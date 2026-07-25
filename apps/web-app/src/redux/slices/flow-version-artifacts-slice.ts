import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FlowParamContentType } from "@lcase/types";
import type { RootState } from "../store";

export type ArtifactMetadataDraft = {
  label: string;
  share: boolean;
  curatedParamNames: string[];
};

// format deliberately omitted -- it's fully derivable from name+contentType
// (see detectFileFormat) and only ever needed transiently, as an input to
// isArtifactCompatible's fallback check, so it's computed at that point of
// use rather than stored
export type ArtifactAuthoringDraftFile = {
  name: string;
  size: number;
  contentType: string;
};

export type ArtifactAuthoringDraft =
  | (ArtifactMetadataDraft & {
      kind: "file";
      // derived synchronously from the picked File at pick-time (name/size/
      // contentType/format) -- never the File object itself. Not serializable,
      // was never a good Redux citizen regardless, and doesn't need to survive
      // a full mode-switch (the component holding the live File already
      // unmounts on route change) -- this is a remembered breadcrumb, not a
      // resumable upload.
      file: ArtifactAuthoringDraftFile | null;
    })
  | (ArtifactMetadataDraft & {
      kind: "text";
      content: string;
      contentType: FlowParamContentType;
    });

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
  // mode/authoringDraft mirror Sims mode's browsing/authoring shape rather
  // than the draft/isEditing split above -- simpler, because (unlike
  // metadata editing) there's no need for the draft to outlive success: a
  // successful create just returns to browsing with the new artifact
  // selected, so one mode field covers it
  mode: "browsing" | "authoring";
  authoringDraft: ArtifactAuthoringDraft | null;
};

const initialState: FlowVersionArtifactsState = {
  flowVersionId: null,
  flowId: null,
  selectedArtifactHash: null,
  draft: null,
  isEditing: false,
  mode: "browsing",
  authoringDraft: null,
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
      state.mode = "browsing";
      state.authoringDraft = null;
    },
    startEditingArtifactMetadata: (
      state,
      action: PayloadAction<ArtifactMetadataDraft>,
    ) => {
      if (state.mode === "authoring") return;
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
    startAuthoringArtifact: (
      state,
      action: PayloadAction<ArtifactAuthoringDraft["kind"]>,
    ) => {
      if (state.isEditing) return;
      state.mode = "authoring";

      const metadata: ArtifactMetadataDraft = {
        label: "",
        share: false,
        curatedParamNames: [],
      };

      switch (action.payload) {
        case "file":
          state.authoringDraft = {
            ...metadata,
            kind: action.payload,
            file: null,
          };
          break;
        case "text":
          state.authoringDraft = {
            ...metadata,
            kind: action.payload,
            content: "",
            contentType: "application/json",
          };
          break;
        default: {
          const _exhaustive: never = action.payload;
          return _exhaustive;
        }
      }
    },
    // shared by cancelAuthoringArtifact (discarding) and artifactAuthored
    // (completing) -- both return to the same blank browsing state, just
    // for different reasons, same pattern flow-version-sims-slice.ts uses
    cancelAuthoringArtifact: (state) => {
      state.mode = "browsing";
      state.authoringDraft = null;
    },
    artifactAuthored: (state) => {
      state.mode = "browsing";
      state.authoringDraft = null;
    },
    updateAuthoringLabel: (state, action: PayloadAction<string>) => {
      if (!state.authoringDraft) return;
      state.authoringDraft.label = action.payload;
    },
    setAuthoringShare: (state, action: PayloadAction<boolean>) => {
      if (!state.authoringDraft) return;
      state.authoringDraft.share = action.payload;
    },
    toggleAuthoringParam: (
      state,
      action: PayloadAction<{ paramName: string; checked: boolean }>,
    ) => {
      if (!state.authoringDraft) return;
      const { paramName, checked } = action.payload;
      if (checked) {
        if (!state.authoringDraft.curatedParamNames.includes(paramName)) {
          state.authoringDraft.curatedParamNames.push(paramName);
        }
      } else {
        state.authoringDraft.curatedParamNames =
          state.authoringDraft.curatedParamNames.filter(
            (name) => name !== paramName,
          );
      }
    },
    // always clears curatedParamNames alongside the file, whether clearing
    // to null or replacing with a different file -- params are gated on a
    // known, current content type, so a stale selection from a
    // previous/absent file must not survive a file change
    setAuthoringFile: (
      state,
      action: PayloadAction<ArtifactAuthoringDraftFile | null>,
    ) => {
      if (!state.authoringDraft) return;
      if (state.authoringDraft.kind !== "file") return;
      state.authoringDraft.file = action.payload;
      state.authoringDraft.curatedParamNames = [];
    },
    setAuthoringContent: (state, action: PayloadAction<string>) => {
      if (!state.authoringDraft) return;
      if (state.authoringDraft.kind !== "text") return;
      state.authoringDraft.content = action.payload;
    },
    setAuthoringContentType: (
      state,
      action: PayloadAction<FlowParamContentType>,
    ) => {
      if (!state.authoringDraft) return;
      if (state.authoringDraft.kind !== "text") return;
      state.authoringDraft.contentType = action.payload;
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
  startAuthoringArtifact,
  cancelAuthoringArtifact,
  artifactAuthored,
  updateAuthoringLabel,
  setAuthoringShare,
  toggleAuthoringParam,
  setAuthoringFile,
  setAuthoringContent,
  setAuthoringContentType,
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
