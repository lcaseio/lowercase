import { useEffect } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Node } from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { useGetRunParamsQuery } from "@/redux/api/runs-api";
import { selectEventById } from "@/redux/slices/events-slice";
import {
  enterFlowVersionRunHistoryScope,
  selectFlowVersionRunHistoryState,
  setActiveDetailsTab,
  setActiveMainTab,
  setFocusedContent,
  setSelectedEventId,
  setSelectedRunId,
  setSelectedStepId,
} from "@/redux/slices/flow-version-run-history-slice";
import { FlowVersionRunHistoryList } from "@/components/flow-version/FlowVersionRunHistoryList";
import { FlowVersionRunGraphPanel } from "@/components/flow-version/FlowVersionRunGraphPanel";
import { FlowVersionRunDetailsPanel } from "@/components/flow-version/FlowVersionRunDetailsPanel";
import { useRunEventsWithStatus } from "@/hooks/use-run-events-with-status";
import { useFlowVersionOutletContext } from "./context";

// run history page for the flow workspace version -- same graph/details
// panels as live Run mode, fed by a selected historical run's events instead
export function FlowVersionRunHistory() {
  const { flowDef, flowAnalysis, flowId, flowVersionId } =
    useFlowVersionOutletContext();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (flowVersionId && flowId) {
      dispatch(enterFlowVersionRunHistoryScope({ flowVersionId, flowId }));
    }
  }, [dispatch, flowVersionId, flowId]);

  const historyState = useAppSelector((s) =>
    selectFlowVersionRunHistoryState(s, flowVersionId),
  );

  const { events, stepRunInfo } = useRunEventsWithStatus(
    historyState.selectedRunId,
    Object.keys(flowDef?.steps ?? {}),
  );

  const selectedEvent = useAppSelector((s) =>
    selectEventById(s, historyState.selectedEventId),
  );

  const { data: runParamsData } = useGetRunParamsQuery(
    historyState.selectedRunId
      ? { runId: historyState.selectedRunId }
      : skipToken,
  );
  const paramHashes = runParamsData?.ok ? runParamsData.value : {};

  function handleNodeClick(node: Node) {
    dispatch(setSelectedStepId(node.id));
    dispatch(setActiveDetailsTab("stepResults"));
  }

  const openInMainPanel = (
    title: string,
    value: string,
    language: "json" | "markdown" | "plaintext",
  ) => {
    dispatch(setFocusedContent({ title, value, language }));
  };

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border dark:border-neutral-800"
    >
      <ResizablePanel defaultSize="20%" className="dark:bg-neutral-875">
        <FlowVersionRunHistoryList
          flowVersionId={flowVersionId}
          selectedRunId={historyState.selectedRunId}
          onSelectRun={(runId) => dispatch(setSelectedRunId(runId))}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%" style={{ overflow: "hidden" }}>
        <FlowVersionRunGraphPanel
          flowDef={flowDef}
          flowAnalysis={flowAnalysis}
          activeMainTab={historyState.activeMainTab}
          onActiveMainTabChange={(tab) => dispatch(setActiveMainTab(tab))}
          onNodeClick={handleNodeClick}
          events={events}
          selectedEventId={historyState.selectedEventId}
          onEventClick={(id) => {
            dispatch(setSelectedEventId(id));
            dispatch(setActiveDetailsTab("eventDetails"));
          }}
          focusedContent={historyState.focusedContent}
          stepRunInfo={stepRunInfo}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        <FlowVersionRunDetailsPanel
          activeDetailsTab={historyState.activeDetailsTab}
          onActiveDetailsTabChange={(tab) => dispatch(setActiveDetailsTab(tab))}
          selectedEvent={selectedEvent}
          selectedStepId={historyState.selectedStepId}
          flowDef={flowDef}
          refs={flowAnalysis?.flowAnalysis.refs ?? []}
          paramHashes={paramHashes}
          stepRunInfo={stepRunInfo}
          onOpenInMainPanel={openInMainPanel}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
