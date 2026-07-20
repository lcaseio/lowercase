import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Node } from "@xyflow/react";
import { selectEventById } from "@/redux/slices/events-slice";
import {
  clearRun,
  enterFlowVersionRunScope,
  selectFlowVersionRunState,
  setActiveDetailsTab,
  setActiveMainTab,
  setFocusedContent,
  setParamHash,
  setSelectedEventId,
  setSelectedStepId,
} from "@/redux/slices/flow-version-run-slice";
import { FlowVersionRunParamsPanel } from "@/components/flow-version/FlowVersionRunParamsPanel";
import { FlowVersionRunGraphPanel } from "@/components/flow-version/FlowVersionRunGraphPanel";
import { FlowVersionRunDetailsPanel } from "@/components/flow-version/FlowVersionRunDetailsPanel";
import { useRunEventsWithStatus } from "@/hooks/use-run-events-with-status";
import { useFlowVersionOutletContext } from "./context";

// run page for the flow workspace version
export function FlowVersionRun() {
  const { flowDef, flowAnalysis, flowId, flowVersionId, flowVersionRecord } =
    useFlowVersionOutletContext();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (flowVersionId && flowId) {
      dispatch(enterFlowVersionRunScope({ flowVersionId, flowId }));
    }
  }, [dispatch, flowVersionId, flowId]);

  const runState = useAppSelector((s) =>
    selectFlowVersionRunState(s, flowVersionId),
  );

  const { events, stepRunInfo } = useRunEventsWithStatus(
    runState.runId,
    Object.keys(flowDef?.steps ?? {}),
  );

  const selectedEvent = useAppSelector((s) =>
    selectEventById(s, runState.selectedEventId),
  );

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
        <FlowVersionRunParamsPanel
          flowId={flowId}
          flowVersionId={flowVersionId}
          flowDefHash={flowVersionRecord?.definitionHash ?? null}
          flowDef={flowDef}
          refs={flowAnalysis?.flowAnalysis.refs ?? []}
          params={flowDef?.params}
          selectedParamHashes={runState.selectedParamHashes}
          runId={runState.runId}
          runCreatedAt={runState.runCreatedAt}
          onParamChange={(name, hash) => dispatch(setParamHash({ name, hash }))}
          onClearRun={() => dispatch(clearRun())}
          onOpenInMainPanel={openInMainPanel}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%" style={{ overflow: "hidden" }}>
        <FlowVersionRunGraphPanel
          flowDef={flowDef}
          flowAnalysis={flowAnalysis}
          activeMainTab={runState.activeMainTab}
          onActiveMainTabChange={(tab) => dispatch(setActiveMainTab(tab))}
          onNodeClick={handleNodeClick}
          events={events}
          selectedEventId={runState.selectedEventId}
          onEventClick={(id) => {
            dispatch(setSelectedEventId(id));
            dispatch(setActiveDetailsTab("eventDetails"));
          }}
          focusedContent={runState.focusedContent}
          stepRunInfo={stepRunInfo}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        <FlowVersionRunDetailsPanel
          activeDetailsTab={runState.activeDetailsTab}
          onActiveDetailsTabChange={(tab) => dispatch(setActiveDetailsTab(tab))}
          selectedEvent={selectedEvent}
          selectedStepId={runState.selectedStepId}
          flowDef={flowDef}
          refs={flowAnalysis?.flowAnalysis.refs ?? []}
          paramHashes={runState.selectedParamHashes}
          stepRunInfo={stepRunInfo}
          onOpenInMainPanel={openInMainPanel}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
