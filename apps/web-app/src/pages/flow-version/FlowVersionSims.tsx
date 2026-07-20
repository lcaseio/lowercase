import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Node } from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { useGetRunParamsQuery } from "@/redux/api/runs-api";
import { useGetSimQuery, usePostSimsMutation } from "@/redux/api/sims-api";
import { selectEventById } from "@/redux/slices/events-slice";
import {
  cancelCreatingSim,
  enterFlowVersionSimsScope,
  selectFlowVersionSimsState,
  selectRunForNewSim,
  selectSim,
  setActiveDetailsTab,
  setActiveMainTab,
  setFocusedContent,
  setSelectedEventId,
  setSelectedStepId,
  setSimDescription,
  setSimName,
  simSaved,
  startCreatingSim,
  toggleStepReused,
} from "@/redux/slices/flow-version-sims-slice";
import { FlowVersionSimsList } from "@/components/flow-version/FlowVersionSimsList";
import { FlowVersionRunHistoryList } from "@/components/flow-version/FlowVersionRunHistoryList";
import { FlowVersionRunGraphPanel } from "@/components/flow-version/FlowVersionRunGraphPanel";
import { FlowVersionRunDetailsPanel } from "@/components/flow-version/FlowVersionRunDetailsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const isAuthoring = simsState.mode === "authoring";

  const { data: simDefData } = useGetSimQuery(
    !isAuthoring && simsState.selectedSimId
      ? { simId: simsState.selectedSimId }
      : skipToken,
  );
  const viewedSim = simDefData?.ok ? simDefData.value : null;

  const inspectingRunId = isAuthoring
    ? simsState.selectedRunId
    : (viewedSim?.spec.parentRunId ?? null);
  const inspectingReusedStepIds = isAuthoring
    ? simsState.reusedStepIds
    : (viewedSim?.spec.reuse ?? []);

  const { events, stepRunInfo } = useRunEventsWithStatus(
    inspectingRunId,
    Object.keys(flowDef?.steps ?? {}),
  );

  const selectedEvent = useAppSelector((s) =>
    selectEventById(s, simsState.selectedEventId),
  );

  const { data: runParamsData } = useGetRunParamsQuery(
    inspectingRunId ? { runId: inspectingRunId } : skipToken,
  );
  const paramHashes = runParamsData?.ok ? runParamsData.value : {};

  const [postSims, { isLoading: isSaving }] = usePostSimsMutation();
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave =
    simsState.simName.trim().length > 0 &&
    simsState.selectedRunId !== null &&
    simsState.reusedStepIds.length > 0 &&
    !isSaving;

  async function handleSave() {
    if (!flowId || !flowVersionId || !simsState.selectedRunId) return;
    setSaveError(null);
    try {
      const result = await postSims({
        name: simsState.simName.trim(),
        description: simsState.simDescription.trim() || undefined,
        flowId,
        flowVersionId,
        parentRunId: simsState.selectedRunId,
        reuse: simsState.reusedStepIds,
      }).unwrap();
      if (result.ok) {
        dispatch(simSaved());
      } else {
        setSaveError(result.error);
      }
    } catch {
      setSaveError("Failed to save sim. Please try again.");
    }
  }

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
      <ResizablePanel
        defaultSize={isAuthoring ? "20%" : "30%"}
        className="dark:bg-neutral-875"
      >
        {isAuthoring ? (
          <div className="h-full flex flex-col">
            <div className="p-2 flex flex-col gap-2">
              <span className="text-md font-medium">New Sim</span>
              <Input
                placeholder="Name"
                value={simsState.simName}
                onChange={(e) => dispatch(setSimName(e.target.value))}
              />
              <Textarea
                placeholder="Description (optional)"
                value={simsState.simDescription}
                onChange={(e) => dispatch(setSimDescription(e.target.value))}
              />
              {saveError && (
                <p className="text-xs text-destructive">{saveError}</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="cursor-pointer text-neutral-900 bg-emerald-300 hover:bg-emerald-200 dark:bg-emerald-800 dark:hover:bg-emerald-600 dark:text-neutral-50"
                  disabled={!canSave}
                  onClick={handleSave}
                >
                  Save
                </Button>
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
                Select a run below to reuse its steps. Mark at least one step as
                reused before saving.
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
            selectedSimId={simsState.selectedSimId}
            onSelectSim={(simId) => dispatch(selectSim(simId))}
          />
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%" style={{ overflow: "hidden" }}>
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
          reusedStepIds={inspectingReusedStepIds}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        <FlowVersionRunDetailsPanel
          activeDetailsTab={simsState.activeDetailsTab}
          onActiveDetailsTabChange={(tab) => dispatch(setActiveDetailsTab(tab))}
          selectedEvent={selectedEvent}
          selectedStepId={simsState.selectedStepId}
          flowDef={flowDef}
          refs={flowAnalysis?.flowAnalysis.refs ?? []}
          paramHashes={paramHashes}
          stepRunInfo={stepRunInfo}
          onOpenInMainPanel={openInMainPanel}
          isStepReused={
            simsState.selectedStepId
              ? inspectingReusedStepIds.includes(simsState.selectedStepId)
              : false
          }
          onToggleStepReused={
            isAuthoring && simsState.selectedStepId
              ? () =>
                  dispatch(toggleStepReused(simsState.selectedStepId as string))
              : undefined
          }
          simSettings={
            isAuthoring
              ? undefined
              : {
                  sim: viewedSim?.sim ?? null,
                  parentRunId: viewedSim?.spec.parentRunId ?? null,
                }
          }
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
