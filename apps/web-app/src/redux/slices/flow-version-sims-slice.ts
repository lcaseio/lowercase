import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type {
  FlowVersionRunDetailsTab,
  FlowVersionRunFocusedContent,
  FlowVersionRunMainTab,
} from "@/lib/run-panel-state.types";

export type FlowVersionSimsMode = "browsing" | "authoring";

type FlowVersionSimsState = {
  flowVersionId: string | null;
  flowId: string | null;
  mode: FlowVersionSimsMode;
  selectedRunId: string | null;
  activeMainTab: FlowVersionRunMainTab;
  activeDetailsTab: FlowVersionRunDetailsTab;
  selectedEventId: string | null;
  selectedStepId: string | null;
  focusedContent: FlowVersionRunFocusedContent | null;
  reusedStepIds: string[];
  simName: string;
  simDescription: string;
  selectedSimId: string | null;
};

const initialState: FlowVersionSimsState = {
  flowVersionId: null,
  flowId: null,
  mode: "browsing",
  selectedRunId: null,
  activeMainTab: "graph",
  activeDetailsTab: "settings",
  selectedEventId: null,
  selectedStepId: null,
  focusedContent: null,
  reusedStepIds: [],
  simName: "",
  simDescription: "",
  selectedSimId: null,
};

// shared by cancelCreatingSim (discarding) and simSaved (completing) -- both
// return to the same blank browsing state, just for different reasons.
// nulling selectedSimId here is what makes the browsing list's
// auto-select-latest effect land on a just-saved sim right after Save
function resetToBrowsing(state: FlowVersionSimsState) {
  state.mode = "browsing";
  state.selectedRunId = null;
  state.activeMainTab = "graph";
  state.activeDetailsTab = "settings";
  state.selectedEventId = null;
  state.selectedStepId = null;
  state.focusedContent = null;
  state.reusedStepIds = [];
  state.simName = "";
  state.simDescription = "";
  state.selectedSimId = null;
}

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
      // settings tab doesn't exist while authoring -- fall back to a tab
      // that's always available rather than leaving none selected
      if (state.activeDetailsTab === "settings") {
        state.activeDetailsTab = "eventDetails";
      }
    },
    // deliberately does NOT clear selectedStepId/reusedStepIds/activeDetailsTab --
    // reuse decisions and which step you're inspecting survive switching runs
    // while authoring. selectedEventId/focusedContent DO get cleared: an event
    // from the previous run doesn't exist in the new run's event stream, and
    // focused content is a frozen snapshot of specific stale data.
    selectRunForNewSim: (state, action: PayloadAction<string>) => {
      state.selectedRunId = action.payload;
      state.selectedEventId = null;
      state.focusedContent = null;
      state.activeMainTab = "graph";
    },
    cancelCreatingSim: (state) => {
      resetToBrowsing(state);
    },
    simSaved: (state) => {
      resetToBrowsing(state);
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
    toggleStepReused: (state, action: PayloadAction<string>) => {
      const stepId = action.payload;
      state.reusedStepIds = state.reusedStepIds.includes(stepId)
        ? state.reusedStepIds.filter((id) => id !== stepId)
        : [...state.reusedStepIds, stepId];
    },
    setSimName: (state, action: PayloadAction<string>) => {
      state.simName = action.payload;
    },
    setSimDescription: (state, action: PayloadAction<string>) => {
      state.simDescription = action.payload;
    },
    // mirrors selectRunForNewSim's reset rules: which step you're inspecting
    // and its details tab survive switching which sim you're viewing, but an
    // event/focused content from the previous sim's run doesn't carry over
    selectSim: (state, action: PayloadAction<string>) => {
      state.selectedSimId = action.payload;
      state.selectedEventId = null;
      state.focusedContent = null;
      state.activeMainTab = "graph";
    },
  },
});

export const {
  enterFlowVersionSimsScope,
  startCreatingSim,
  selectRunForNewSim,
  cancelCreatingSim,
  simSaved,
  setActiveMainTab,
  setActiveDetailsTab,
  setSelectedEventId,
  setSelectedStepId,
  setFocusedContent,
  toggleStepReused,
  setSimName,
  setSimDescription,
  selectSim,
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
