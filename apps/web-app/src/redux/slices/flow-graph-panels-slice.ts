import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { SidePanelTab } from "@/components/explorer/flow-graph-panel/SidePanel";

export type FlowGraphPanelState = {
  selectedParamHashes: Record<string, string>;
  rightPanelTab: SidePanelTab | null;
  runId: string | null;
};

export type FlowGraphPanelsState = Record<string, FlowGraphPanelState>;

const DEFAULT_PANEL_STATE: FlowGraphPanelState = {
  selectedParamHashes: {},
  rightPanelTab: null,
  runId: null,
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
    // named to match dockview's own onDidRemovePanel event, not a different
    // verb -- dispatched from a central listener wherever the live
    // dockviewApi is held, not from this panel's own component
    panelRemoved: (state, action: PayloadAction<{ panelId: string }>) => {
      delete state[action.payload.panelId];
    },
  },
});

export const { paramHashSet, rightPanelTabSet, runSubmitted, panelRemoved } =
  flowGraphPanelsSlice.actions;

export const selectFlowGraphPanelState = (
  state: RootState,
  panelId: string,
): FlowGraphPanelState => state.flowGraphPanels[panelId] ?? DEFAULT_PANEL_STATE;
