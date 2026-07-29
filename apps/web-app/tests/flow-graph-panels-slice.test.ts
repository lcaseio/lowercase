import { describe, expect, it } from "vitest";
import {
  flowGraphPanelsSlice,
  paramHashSet,
  panelRemoved,
  rightPanelTabSet,
  runSubmitted,
  selectFlowGraphPanelState,
} from "@/redux/slices/flow-graph-panels-slice";
import type { RootState } from "@/redux/store";

const reducer = flowGraphPanelsSlice.reducer;

const DEFAULT_PANEL_STATE = {
  selectedParamHashes: {},
  rightPanelTab: null,
  runId: null,
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

  describe("rightPanelTabSet", () => {
    it("creates a panel entry lazily and sets the tab", () => {
      const state = reducer(
        {},
        rightPanelTabSet({ panelId: "flow-graph-v1", tab: "params" }),
      );
      expect(state["flow-graph-v1"]).toEqual({
        ...DEFAULT_PANEL_STATE,
        rightPanelTab: "params",
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
