import { describe, expect, it } from "vitest";
import {
  flowGraphPanelsSlice,
  paramHashSet,
  sidePanelTabSet,
  runSubmitted,
  stepSelected,
  simDraftStarted,
  simDraftReuseToggled,
  simDraftEnded,
  selectFlowGraphPanelState,
} from "@/redux/slices/flow-graph-panels-slice";
import { panelRemoved } from "@/redux/slices/panel-lifecycle-actions";
import type { RootState } from "@/redux/store";

const reducer = flowGraphPanelsSlice.reducer;

const DEFAULT_PANEL_STATE = {
  selectedParamHashes: {},
  sidePanelTab: null,
  runId: null,
  selectedStepId: null,
  simDraft: null,
};

describe("flowGraphPanelsSlice", () => {
  describe("paramHashSet", () => {
    it("creates a panel entry lazily and sets a hash", () => {
      const state = reducer(
        {},
        paramHashSet({ panelId: "flow-graph-v1", name: "a", hash: "h1" }),
      );
      expect(state["flow-graph-v1"]).toEqual({
        ...DEFAULT_PANEL_STATE,
        selectedParamHashes: { a: "h1" },
      });
    });

    it("deletes the hash from selectedParamHashes when hash is omitted", () => {
      let state = reducer(
        {},
        paramHashSet({ panelId: "flow-graph-v1", name: "a", hash: "h1" }),
      );
      state = reducer(
        state,
        paramHashSet({ panelId: "flow-graph-v1", name: "a" }),
      );
      expect(state["flow-graph-v1"].selectedParamHashes).toEqual({});
    });
  });

  describe("sidePanelTabSet", () => {
    it("creates a panel entry lazily and sets the tab", () => {
      const state = reducer(
        {},
        sidePanelTabSet({ panelId: "flow-graph-v1", tab: "runinput" }),
      );
      expect(state["flow-graph-v1"]).toEqual({
        ...DEFAULT_PANEL_STATE,
        sidePanelTab: "runinput",
      });
    });
  });

  describe("runSubmitted", () => {
    it("creates a panel entry lazily and sets the runId", () => {
      const state = reducer(
        {},
        runSubmitted({ panelId: "flow-graph-v1", runId: "run-1" }),
      );
      expect(state["flow-graph-v1"]).toEqual({
        ...DEFAULT_PANEL_STATE,
        runId: "run-1",
      });
    });
  });

  describe("stepSelected", () => {
    it("creates a panel entry lazily and sets the selectedStepId", () => {
      const state = reducer(
        {},
        stepSelected({ panelId: "flow-graph-v1", stepId: "step-1" }),
      );
      expect(state["flow-graph-v1"]).toEqual({
        ...DEFAULT_PANEL_STATE,
        selectedStepId: "step-1",
      });
    });
  });

  describe("simDraftStarted", () => {
    it("creates a panel entry lazily and starts an empty draft", () => {
      const state = reducer({}, simDraftStarted({ panelId: "flow-graph-v1" }));
      expect(state["flow-graph-v1"]).toEqual({
        ...DEFAULT_PANEL_STATE,
        simDraft: { reuse: [] },
      });
    });
  });

  describe("simDraftReuseToggled", () => {
    it("adds a step id to an empty draft", () => {
      let state = reducer({}, simDraftStarted({ panelId: "flow-graph-v1" }));
      state = reducer(
        state,
        simDraftReuseToggled({ panelId: "flow-graph-v1", stepId: "step-1" }),
      );
      expect(state["flow-graph-v1"].simDraft).toEqual({ reuse: ["step-1"] });
    });

    it("removes an already-marked step id (toggles off)", () => {
      let state = reducer({}, simDraftStarted({ panelId: "flow-graph-v1" }));
      state = reducer(
        state,
        simDraftReuseToggled({ panelId: "flow-graph-v1", stepId: "step-1" }),
      );
      state = reducer(
        state,
        simDraftReuseToggled({ panelId: "flow-graph-v1", stepId: "step-1" }),
      );
      expect(state["flow-graph-v1"].simDraft).toEqual({ reuse: [] });
    });

    it("no-ops when there's no draft to toggle against", () => {
      const state = reducer(
        {},
        simDraftReuseToggled({ panelId: "flow-graph-v1", stepId: "step-1" }),
      );
      expect(state["flow-graph-v1"]).toEqual(DEFAULT_PANEL_STATE);
    });
  });

  describe("simDraftEnded", () => {
    it("clears an in-progress draft back to null", () => {
      let state = reducer({}, simDraftStarted({ panelId: "flow-graph-v1" }));
      state = reducer(
        state,
        simDraftReuseToggled({ panelId: "flow-graph-v1", stepId: "step-1" }),
      );
      state = reducer(state, simDraftEnded({ panelId: "flow-graph-v1" }));
      expect(state["flow-graph-v1"].simDraft).toBeNull();
    });
  });

  it("keeps different panelIds fully independent", () => {
    let state = reducer(
      {},
      paramHashSet({ panelId: "flow-graph-v1", name: "a", hash: "h1" }),
    );
    state = reducer(
      state,
      paramHashSet({ panelId: "flow-graph-v2", name: "b", hash: "h2" }),
    );

    expect(state["flow-graph-v1"].selectedParamHashes).toEqual({ a: "h1" });
    expect(state["flow-graph-v2"].selectedParamHashes).toEqual({ b: "h2" });
  });

  describe("panelRemoved", () => {
    it("deletes an existing key", () => {
      let state = reducer(
        {},
        paramHashSet({ panelId: "flow-graph-v1", name: "a", hash: "h1" }),
      );
      state = reducer(state, panelRemoved({ panelId: "flow-graph-v1" }));
      expect(state["flow-graph-v1"]).toBeUndefined();
    });

    it("no-ops when the key doesn't exist", () => {
      const state = reducer({}, panelRemoved({ panelId: "does-not-exist" }));
      expect(state).toEqual({});
    });
  });

  describe("selectFlowGraphPanelState", () => {
    it("returns the shared default when no entry exists for the panelId", () => {
      const rootState = { flowGraphPanels: {} } as unknown as RootState;
      expect(selectFlowGraphPanelState(rootState, "flow-graph-v1")).toEqual(
        DEFAULT_PANEL_STATE,
      );
    });

    it("returns the real entry once one exists", () => {
      const populated = reducer(
        {},
        runSubmitted({ panelId: "flow-graph-v1", runId: "run-1" }),
      );
      const rootState = {
        flowGraphPanels: populated,
      } as unknown as RootState;
      expect(selectFlowGraphPanelState(rootState, "flow-graph-v1")).toEqual({
        ...DEFAULT_PANEL_STATE,
        runId: "run-1",
      });
    });
  });
});
