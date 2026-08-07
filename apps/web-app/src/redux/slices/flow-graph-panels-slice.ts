import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { SidePanelTab } from "@/components/explorer/flow-graph-panel/SidePanel";
import { panelRemoved } from "./panel-lifecycle-actions";

export type SimDraftState = { reuse: string[] };

export type FlowGraphPanelState = {
  selectedParamHashes: Record<string, string>;
  sidePanelTab: SidePanelTab | null;
  runId: string | null;
  selectedStepId: string | null;
  simDraft: SimDraftState | null;
};

export type FlowGraphPanelsState = Record<string, FlowGraphPanelState>;

const DEFAULT_PANEL_STATE: FlowGraphPanelState = {
  selectedParamHashes: {},
  sidePanelTab: null,
  runId: null,
  selectedStepId: null,
  simDraft: null,
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
    sidePanelTabSet: (
      state,
      action: PayloadAction<{
        panelId: string;
        tab: SidePanelTab | null;
      }>,
    ) => {
      ensurePanel(state, action.payload.panelId).sidePanelTab =
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
    simDraftStarted: (state, action: PayloadAction<{ panelId: string }>) => {
      ensurePanel(state, action.payload.panelId).simDraft = { reuse: [] };
    },
    // toggles whatever the current membership is -- matches the Switch's
    // own onCheckedChange convention downstream (StepResultsTab.tsx),
    // which is typed to take no argument, so this always flips rather than
    // ever being told the new value directly.
    simDraftReuseToggled: (
      state,
      action: PayloadAction<{ panelId: string; stepId: string }>,
    ) => {
      const panel = ensurePanel(state, action.payload.panelId);
      if (!panel.simDraft) return;
      const { stepId } = action.payload;
      panel.simDraft.reuse = panel.simDraft.reuse.includes(stepId)
        ? panel.simDraft.reuse.filter((id) => id !== stepId)
        : [...panel.simDraft.reuse, stepId];
    },
    // dispatched both on explicit cancel and after a successful save --
    // same "stop authoring" meaning either way.
    simDraftEnded: (state, action: PayloadAction<{ panelId: string }>) => {
      ensurePanel(state, action.payload.panelId).simDraft = null;
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
  sidePanelTabSet,
  runSubmitted,
  runSelected,
  stepSelected,
  simDraftStarted,
  simDraftReuseToggled,
  simDraftEnded,
} = flowGraphPanelsSlice.actions;

export const selectFlowGraphPanelState = (
  state: RootState,
  panelId: string,
): FlowGraphPanelState => state.flowGraphPanels[panelId] ?? DEFAULT_PANEL_STATE;
