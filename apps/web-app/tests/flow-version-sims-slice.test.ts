import { describe, expect, it } from "vitest";
import {
  cancelCreatingSim,
  enterFlowVersionSimsScope,
  flowVersionSimsSlice,
  selectFlowVersionSimsState,
  selectRunForNewSim,
  startCreatingSim,
} from "@/redux/slices/flow-version-sims-slice";
import type { RootState } from "@/redux/store";

const reducer = flowVersionSimsSlice.reducer;

const BASE_STATE = {
  flowVersionId: null,
  flowId: null,
  mode: "browsing",
  selectedRunId: null,
};

function stateFor(flowVersionSims: ReturnType<typeof reducer>) {
  return { flowVersionSims } as unknown as RootState;
}

describe("flowVersionSimsSlice", () => {
  it("enters a scope, storing flowVersionId and flowId", () => {
    const state = reducer(
      undefined,
      enterFlowVersionSimsScope({ flowVersionId: "fv-1", flowId: "flow-1" }),
    );
    expect(state).toEqual({
      ...BASE_STATE,
      flowVersionId: "fv-1",
      flowId: "flow-1",
    });
  });

  it("resets to browsing when entering a different flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionSimsScope({ flowVersionId: "fv-1", flowId: "flow-1" }),
    );
    const authoring = reducer(initial, startCreatingSim());
    expect(authoring.mode).toBe("authoring");

    const nextScope = reducer(
      authoring,
      enterFlowVersionSimsScope({ flowVersionId: "fv-2", flowId: "flow-2" }),
    );
    expect(nextScope).toEqual({
      ...BASE_STATE,
      flowVersionId: "fv-2",
      flowId: "flow-2",
    });
  });

  it("keeps existing state when re-entering the same flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionSimsScope({ flowVersionId: "fv-1", flowId: "flow-1" }),
    );
    const authoring = reducer(initial, startCreatingSim());

    const sameScope = reducer(
      authoring,
      enterFlowVersionSimsScope({ flowVersionId: "fv-1", flowId: "flow-1" }),
    );
    expect(sameScope.mode).toBe("authoring");
  });

  it("startCreatingSim switches to authoring with no run selected", () => {
    const state = reducer(undefined, startCreatingSim());
    expect(state.mode).toBe("authoring");
    expect(state.selectedRunId).toBeNull();
  });

  it("selectRunForNewSim sets the selected run without changing mode", () => {
    const authoring = reducer(undefined, startCreatingSim());
    const withRun = reducer(authoring, selectRunForNewSim("run-1"));
    expect(withRun.mode).toBe("authoring");
    expect(withRun.selectedRunId).toBe("run-1");
  });

  it("selectRunForNewSim can be called again to freely switch runs while authoring", () => {
    const authoring = reducer(undefined, startCreatingSim());
    const withFirstRun = reducer(authoring, selectRunForNewSim("run-1"));
    const withSecondRun = reducer(
      withFirstRun,
      selectRunForNewSim("run-2"),
    );
    expect(withSecondRun.mode).toBe("authoring");
    expect(withSecondRun.selectedRunId).toBe("run-2");
  });

  it("cancelCreatingSim returns to browsing and clears the selected run", () => {
    const authoring = reducer(undefined, startCreatingSim());
    const withRun = reducer(authoring, selectRunForNewSim("run-1"));
    const cancelled = reducer(withRun, cancelCreatingSim());
    expect(cancelled.mode).toBe("browsing");
    expect(cancelled.selectedRunId).toBeNull();
  });

  it("selectFlowVersionSimsState returns the empty default when the flowVersionId doesn't match the active scope", () => {
    const active = reducer(
      undefined,
      enterFlowVersionSimsScope({ flowVersionId: "fv-1", flowId: "flow-1" }),
    );
    expect(selectFlowVersionSimsState(stateFor(active), "fv-other")).toEqual(
      BASE_STATE,
    );
    expect(selectFlowVersionSimsState(stateFor(active), "fv-1")).toBe(active);
  });
});
