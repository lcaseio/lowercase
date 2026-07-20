import { describe, expect, it } from "vitest";
import {
  enterFlowVersionRunHistoryScope,
  flowVersionRunHistorySlice,
  selectFlowVersionRunHistoryState,
  setActiveDetailsTab,
  setActiveMainTab,
  setFocusedContent,
  setSelectedEventId,
  setSelectedRunId,
  setSelectedStepId,
} from "@/redux/slices/flow-version-run-history-slice";
import type { RootState } from "@/redux/store";

const reducer = flowVersionRunHistorySlice.reducer;

const BASE_STATE = {
  flowVersionId: null,
  flowId: null,
  selectedRunId: null,
  activeMainTab: "graph",
  activeDetailsTab: "eventDetails",
  selectedEventId: null,
  selectedStepId: null,
  focusedContent: null,
};

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
      ...BASE_STATE,
      flowVersionId: "fv-1",
      flowId: "flow-1",
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
      ...BASE_STATE,
      flowVersionId: "fv-2",
      flowId: "flow-2",
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

  it("setSelectedRunId resets event/step selection and the details tab", () => {
    const withSelection = {
      ...reducer(undefined, setSelectedRunId("run-1")),
      selectedEventId: "evt-1",
      selectedStepId: "step-1",
      activeDetailsTab: "stepResults" as const,
    };
    const state = reducer(withSelection, setSelectedRunId("run-2"));
    expect(state.selectedRunId).toBe("run-2");
    expect(state.selectedEventId).toBeNull();
    expect(state.selectedStepId).toBeNull();
    expect(state.activeDetailsTab).toBe("eventDetails");
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
    ).toEqual(BASE_STATE);
    expect(selectFlowVersionRunHistoryState(stateFor(active), "fv-1")).toBe(
      active,
    );
  });
});
