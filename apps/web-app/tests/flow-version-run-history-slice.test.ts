import { describe, expect, it } from "vitest";
import {
  enterFlowVersionRunHistoryScope,
  flowVersionRunHistorySlice,
  selectFlowVersionRunHistoryState,
  setSelectedRunId,
} from "@/redux/slices/flow-version-run-history-slice";
import type { RootState } from "@/redux/store";

const reducer = flowVersionRunHistorySlice.reducer;

function stateFor(flowVersionRunHistory: ReturnType<typeof reducer>) {
  return { flowVersionRunHistory } as unknown as RootState;
}

describe("flowVersionRunHistorySlice", () => {
  it("enters a scope, storing flowVersionId and flowId", () => {
    const state = reducer(
      undefined,
      enterFlowVersionRunHistoryScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(state).toEqual({
      flowVersionId: "fv-1",
      flowId: "flow-1",
      selectedRunId: null,
    });
  });

  it("resets selectedRunId when entering a different flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionRunHistoryScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    const withRun = reducer(initial, setSelectedRunId("run-1"));
    expect(withRun.selectedRunId).toBe("run-1");

    const nextScope = reducer(
      withRun,
      enterFlowVersionRunHistoryScope({
        flowVersionId: "fv-2",
        flowId: "flow-2",
      }),
    );
    expect(nextScope).toEqual({
      flowVersionId: "fv-2",
      flowId: "flow-2",
      selectedRunId: null,
    });
  });

  it("keeps existing state when re-entering the same flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionRunHistoryScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    const withRun = reducer(initial, setSelectedRunId("run-1"));

    const sameScope = reducer(
      withRun,
      enterFlowVersionRunHistoryScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(sameScope.selectedRunId).toBe("run-1");
  });

  it("setSelectedRunId updates the selected run", () => {
    const state = reducer(undefined, setSelectedRunId("run-42"));
    expect(state.selectedRunId).toBe("run-42");
  });

  it("selectFlowVersionRunHistoryState returns the empty default when the flowVersionId doesn't match the active scope", () => {
    const active = reducer(
      undefined,
      enterFlowVersionRunHistoryScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(
      selectFlowVersionRunHistoryState(stateFor(active), "fv-other"),
    ).toEqual({
      flowVersionId: null,
      flowId: null,
      selectedRunId: null,
    });
    expect(selectFlowVersionRunHistoryState(stateFor(active), "fv-1")).toBe(
      active,
    );
  });
});
