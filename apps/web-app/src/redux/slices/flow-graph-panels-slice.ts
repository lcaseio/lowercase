import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { SidePanelTab } from "@/components/explorer/flow-graph-panel/SidePanel";
import { panelRemoved } from "./panel-lifecycle-actions";

export type FlowGraphPanelState = {
  selectedParamHashes: Record<string, string>;
  rightPanelTab: SidePanelTab | null;
  runId: string | null;
  selectedStepId: string | null;
};

export type FlowGraphPanelsState = Record<string, FlowGraphPanelState>;

const DEFAULT_PANEL_STATE: FlowGraphPanelState = {
  selectedParamHashes: {},
  rightPanelTab: null,
  runId: null,
  selectedStepId: null,
};

const initialState: FlowGraphPanelsState = {};

// each key gets its own fresh selectedParamHashes object -- never a shared
// reference to DEFAULT_PANEL_STATE's, which would let a write to one panel
// mutate another's
function ensurePanel(state: FlowGraphPanelsState, panelId: string) {
  return (state[panelId] ??= {
    ...DEFAULT_PANEL_STATE,
    selectedParamHashes: {},
  });
}

export const flowGraphPanelsSlice = createSlice({
  name: "flowGraphPanels",
  initialState,
  reducers: {
    paramHashSet: (
      state,
      action: PayloadAction<{ panelId: string; name: string; hash?: string }>,
    ) => {
      const { panelId, name, hash } = action.payload;
      const panel = ensurePanel(state, panelId);
      if (!hash) {
        delete panel.selectedParamHashes[name];
        return;
      }
      panel.selectedParamHashes[name] = hash;
    },
    rightPanelTabSet: (
      state,
      action: PayloadAction<{
        panelId: string;
        tab: SidePanelTab | null;
      }>,
    ) => {
      ensurePanel(state, action.payload.panelId).rightPanelTab =
        action.payload.tab;
    },
    runSubmitted: (
      state,
      action: PayloadAction<{ panelId: string; runId: string }>,
    ) => {
      ensurePanel(state, action.payload.panelId).runId = action.payload.runId;
    },
    // mechanically identical to runSubmitted, but for a panel opened
    // directly at an existing historical run (from the tree's Runs list)
    // rather than one that just submitted a fresh run itself
    runSelected: (
      state,
      action: PayloadAction<{ panelId: string; runId: string }>,
    ) => {
      ensurePanel(state, action.payload.panelId).runId = action.payload.runId;
    },
    stepSelected: (
      state,
      action: PayloadAction<{ panelId: string; stepId: string }>,
    ) => {
      ensurePanel(state, action.payload.panelId).selectedStepId =
        action.payload.stepId;
    },
  },
  // panelRemoved is shared across every keyed-by-panelId slice (see
  // panel-lifecycle-actions.ts) -- dispatched once from a central listener
  // wherever the live dockviewApi is held, not from this panel's own
  // component.
  extraReducers: (builder) => {
    builder.addCase(panelRemoved, (state, action) => {
      delete state[action.payload.panelId];
    });
  },
});

export const {
  paramHashSet,
  rightPanelTabSet,
  runSubmitted,
  runSelected,
  stepSelected,
} = flowGraphPanelsSlice.actions;

export const selectFlowGraphPanelState = (
  state: RootState,
  panelId: string,
): FlowGraphPanelState => state.flowGraphPanels[panelId] ?? DEFAULT_PANEL_STATE;
