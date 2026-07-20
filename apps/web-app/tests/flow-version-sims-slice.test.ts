import { describe, expect, it } from "vitest";
import {
  cancelCreatingSim,
  enterFlowVersionSimsScope,
  flowVersionSimsSlice,
  selectFlowVersionSimsState,
  selectRunForNewSim,
  setActiveDetailsTab,
  setActiveMainTab,
  setFocusedContent,
  setSelectedEventId,
  setSelectedStepId,
  startCreatingSim,
  toggleStepReused,
} from "@/redux/slices/flow-version-sims-slice";
import type { RootState } from "@/redux/store";

const reducer = flowVersionSimsSlice.reducer;

const BASE_STATE = {
  flowVersionId: null,
  flowId: null,
  mode: "browsing",
  selectedRunId: null,
  activeMainTab: "graph",
  activeDetailsTab: "eventDetails",
  selectedEventId: null,
  selectedStepId: null,
  focusedContent: null,
  reusedStepIds: [],
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

  it("selectRunForNewSim preserves reuse selections and the selected step across a run switch, but clears event/focused state", () => {
    const authoring = reducer(undefined, startCreatingSim());
    const withFirstRun = reducer(authoring, selectRunForNewSim("run-1"));
    const withStep = reducer(withFirstRun, setSelectedStepId("step-1"));
    const withReuse = reducer(withStep, toggleStepReused("step-1"));
    const withDetailsTab = reducer(
      withReuse,
      setActiveDetailsTab("stepResults"),
    );
    const withEventAndFocus = {
      ...reducer(withDetailsTab, setSelectedEventId("evt-1")),
      focusedContent: { title: "t", value: "v", language: "plaintext" as const },
      activeMainTab: "focused" as const,
    };

    const withSecondRun = reducer(
      withEventAndFocus,
      selectRunForNewSim("run-2"),
    );

    expect(withSecondRun.selectedRunId).toBe("run-2");
    expect(withSecondRun.selectedStepId).toBe("step-1");
    expect(withSecondRun.reusedStepIds).toEqual(["step-1"]);
    expect(withSecondRun.activeDetailsTab).toBe("stepResults");
    expect(withSecondRun.selectedEventId).toBeNull();
    expect(withSecondRun.focusedContent).toBeNull();
    expect(withSecondRun.activeMainTab).toBe("graph");
  });

  it("cancelCreatingSim resets reuse selections and step/tab state along with the run", () => {
    const authoring = reducer(undefined, startCreatingSim());
    const withRun = reducer(authoring, selectRunForNewSim("run-1"));
    const withStep = reducer(withRun, setSelectedStepId("step-1"));
    const withReuse = reducer(withStep, toggleStepReused("step-1"));

    const cancelled = reducer(withReuse, cancelCreatingSim());
    expect(cancelled).toEqual(BASE_STATE);
  });

  it("setActiveMainTab updates the active main tab", () => {
    const state = reducer(undefined, setActiveMainTab("events"));
    expect(state.activeMainTab).toBe("events");
  });

  it("setActiveDetailsTab updates the active details tab", () => {
    const state = reducer(undefined, setActiveDetailsTab("stepResults"));
    expect(state.activeDetailsTab).toBe("stepResults");
  });

  it("setSelectedEventId updates the selected event", () => {
    const state = reducer(undefined, setSelectedEventId("evt-42"));
    expect(state.selectedEventId).toBe("evt-42");
  });

  it("setSelectedStepId updates the selected step", () => {
    const state = reducer(undefined, setSelectedStepId("step-42"));
    expect(state.selectedStepId).toBe("step-42");
  });

  it("setFocusedContent stores the content and switches the main tab to focused", () => {
    const content = {
      title: "Output",
      value: "hello",
      language: "plaintext" as const,
    };
    const state = reducer(undefined, setFocusedContent(content));
    expect(state.focusedContent).toEqual(content);
    expect(state.activeMainTab).toBe("focused");
  });

  it("toggleStepReused adds then removes a step id", () => {
    const added = reducer(undefined, toggleStepReused("step-1"));
    expect(added.reusedStepIds).toEqual(["step-1"]);

    const addedSecond = reducer(added, toggleStepReused("step-2"));
    expect(addedSecond.reusedStepIds).toEqual(["step-1", "step-2"]);

    const removedFirst = reducer(addedSecond, toggleStepReused("step-1"));
    expect(removedFirst.reusedStepIds).toEqual(["step-2"]);
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
