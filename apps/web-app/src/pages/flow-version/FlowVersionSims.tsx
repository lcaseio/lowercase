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
  cancelCreatingSim,
  enterFlowVersionSimsScope,
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
import { FlowVersionSimsList } from "@/components/flow-version/FlowVersionSimsList";
import { FlowVersionRunHistoryList } from "@/components/flow-version/FlowVersionRunHistoryList";
import { FlowVersionRunGraphPanel } from "@/components/flow-version/FlowVersionRunGraphPanel";
import { FlowVersionRunDetailsPanel } from "@/components/flow-version/FlowVersionRunDetailsPanel";
import { Button } from "@/components/ui/button";
import { useRunEventsWithStatus } from "@/hooks/use-run-events-with-status";
import { useFlowVersionOutletContext } from "./context";

// sims mode page for the flow workspace version -- browsing shows the sim
// list; authoring reuses Run History's graph/details pieces to let you
// inspect any run's steps and mark them reused, while freely switching which
// run you're looking at (reuse choices and the selected step persist across
// that switch -- see flow-version-sims-slice.ts)
export function FlowVersionSims() {
  const { flowDef, flowAnalysis, flowId, flowVersionId } =
    useFlowVersionOutletContext();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (flowVersionId && flowId) {
      dispatch(enterFlowVersionSimsScope({ flowVersionId, flowId }));
    }
  }, [dispatch, flowVersionId, flowId]);

  const simsState = useAppSelector((s) =>
    selectFlowVersionSimsState(s, flowVersionId),
  );

  const { events, stepRunInfo } = useRunEventsWithStatus(
    simsState.selectedRunId,
    Object.keys(flowDef?.steps ?? {}),
  );

  const selectedEvent = useAppSelector((s) =>
    selectEventById(s, simsState.selectedEventId),
  );

  const { data: runParamsData } = useGetRunParamsQuery(
    simsState.selectedRunId ? { runId: simsState.selectedRunId } : skipToken,
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

  const isAuthoring = simsState.mode === "authoring";

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border dark:border-neutral-800"
    >
      <ResizablePanel
        defaultSize={isAuthoring ? "20%" : "30%"}
        className="dark:bg-neutral-875"
      >
        {isAuthoring ? (
          <div className="h-full flex flex-col">
            <div className="p-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Sim</span>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer bg-rose-300 hover:bg-rose-200 dark:bg-rose-800 dark:hover:bg-rose-600"
                  onClick={() => dispatch(cancelCreatingSim())}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a run below to reuse its steps.
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <FlowVersionRunHistoryList
                flowVersionId={flowVersionId}
                selectedRunId={simsState.selectedRunId}
                onSelectRun={(runId) => dispatch(selectRunForNewSim(runId))}
              />
            </div>
          </div>
        ) : (
          <FlowVersionSimsList
            flowVersionId={flowVersionId}
            onCreateNew={() => dispatch(startCreatingSim())}
          />
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%" style={{ overflow: "hidden" }}>
        {isAuthoring ? (
          <FlowVersionRunGraphPanel
            flowDef={flowDef}
            flowAnalysis={flowAnalysis}
            activeMainTab={simsState.activeMainTab}
            onActiveMainTabChange={(tab) => dispatch(setActiveMainTab(tab))}
            onNodeClick={handleNodeClick}
            events={events}
            selectedEventId={simsState.selectedEventId}
            onEventClick={(id) => {
              dispatch(setSelectedEventId(id));
              dispatch(setActiveDetailsTab("eventDetails"));
            }}
            focusedContent={simsState.focusedContent}
            stepRunInfo={stepRunInfo}
            reusedStepIds={simsState.reusedStepIds}
          />
        ) : (
          <div className="p-4 text-muted-foreground">
            Select New to create a sim.
          </div>
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        {isAuthoring && (
          <FlowVersionRunDetailsPanel
            activeDetailsTab={simsState.activeDetailsTab}
            onActiveDetailsTabChange={(tab) =>
              dispatch(setActiveDetailsTab(tab))
            }
            selectedEvent={selectedEvent}
            selectedStepId={simsState.selectedStepId}
            flowDef={flowDef}
            refs={flowAnalysis?.flowAnalysis.refs ?? []}
            paramHashes={paramHashes}
            stepRunInfo={stepRunInfo}
            onOpenInMainPanel={openInMainPanel}
            isStepReused={
              simsState.selectedStepId
                ? simsState.reusedStepIds.includes(simsState.selectedStepId)
                : false
            }
            onToggleStepReused={
              simsState.selectedStepId
                ? () =>
                    dispatch(
                      toggleStepReused(simsState.selectedStepId as string),
                    )
                : undefined
            }
          />
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
