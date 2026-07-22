import { describe, expect, it } from "vitest";
import {
  enterFlowVersionArtifactsScope,
  flowVersionArtifactsSlice,
  selectArtifact,
  selectFlowVersionArtifactsState,
} from "@/redux/slices/flow-version-artifacts-slice";
import type { RootState } from "@/redux/store";

const reducer = flowVersionArtifactsSlice.reducer;

const BASE_STATE = {
  flowVersionId: null,
  flowId: null,
  selectedArtifactHash: null,
};

function stateFor(flowVersionArtifacts: ReturnType<typeof reducer>) {
  return { flowVersionArtifacts } as unknown as RootState;
}

describe("flowVersionArtifactsSlice", () => {
  it("enters a scope, storing flowVersionId and flowId", () => {
    const state = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(state).toEqual({
      ...BASE_STATE,
      flowVersionId: "fv-1",
      flowId: "flow-1",
    });
  });

  it("resets the selection when entering a different flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    const selected = reducer(initial, selectArtifact("a".repeat(64)));
    expect(selected.selectedArtifactHash).toBe("a".repeat(64));

    const nextScope = reducer(
      selected,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-2",
        flowId: "flow-2",
      }),
    );
    expect(nextScope).toEqual({
      ...BASE_STATE,
      flowVersionId: "fv-2",
      flowId: "flow-2",
    });
  });

  it("keeps an existing selection when re-entering the same flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    const selected = reducer(initial, selectArtifact("a".repeat(64)));

    const sameScope = reducer(
      selected,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(sameScope.selectedArtifactHash).toBe("a".repeat(64));
  });

  it("selectArtifact sets the selected artifact hash", () => {
    const state = reducer(undefined, selectArtifact("a".repeat(64)));
    expect(state.selectedArtifactHash).toBe("a".repeat(64));
  });

  it("selectArtifact can be called again to freely switch artifacts", () => {
    const first = reducer(undefined, selectArtifact("a".repeat(64)));
    const second = reducer(first, selectArtifact("b".repeat(64)));
    expect(second.selectedArtifactHash).toBe("b".repeat(64));
  });

  it("selectFlowVersionArtifactsState returns the empty default when the flowVersionId doesn't match the active scope", () => {
    const active = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(
      selectFlowVersionArtifactsState(stateFor(active), "fv-other"),
    ).toEqual(BASE_STATE);
    expect(selectFlowVersionArtifactsState(stateFor(active), "fv-1")).toBe(
      active,
    );
  });
});
