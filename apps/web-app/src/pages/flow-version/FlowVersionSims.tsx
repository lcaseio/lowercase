import { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  cancelCreatingSim,
  enterFlowVersionSimsScope,
  selectFlowVersionSimsState,
  selectRunForNewSim,
  startCreatingSim,
} from "@/redux/slices/flow-version-sims-slice";
import { FlowVersionSimsList } from "@/components/flow-version/FlowVersionSimsList";
import { FlowVersionRunHistoryList } from "@/components/flow-version/FlowVersionRunHistoryList";
import { Button } from "@/components/ui/button";
import { useFlowVersionOutletContext } from "./context";

// sims mode page for the flow workspace version -- scaffold only, no
// graph/reuse-marking yet, just proving the browsing<->authoring state
// machine and sim/run list data pipes work
export function FlowVersionSims() {
  const { flowId, flowVersionId } = useFlowVersionOutletContext();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (flowVersionId && flowId) {
      dispatch(enterFlowVersionSimsScope({ flowVersionId, flowId }));
    }
  }, [dispatch, flowVersionId, flowId]);

  const simsState = useAppSelector((s) =>
    selectFlowVersionSimsState(s, flowVersionId),
  );

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border dark:border-neutral-800"
    >
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-875">
        {simsState.mode === "browsing" ? (
          <FlowVersionSimsList
            flowVersionId={flowVersionId}
            onCreateNew={() => dispatch(startCreatingSim())}
          />
        ) : (
          <FlowVersionRunHistoryList
            flowVersionId={flowVersionId}
            selectedRunId={simsState.selectedRunId}
            onSelectRun={(runId) => dispatch(selectRunForNewSim(runId))}
          />
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="70%" className="dark:bg-neutral-800">
        <div className="p-4 overflow-y-auto h-full">
          {simsState.mode === "browsing" ? (
            <p className="text-muted-foreground">Select New to create a sim.</p>
          ) : simsState.selectedRunId === null ? (
            <>
              <p className="text-muted-foreground mb-2">
                Pick a run to continue.
              </p>

              <Button
                type="button"
                variant="outline"
                className="cursor-pointer  bg-rose-300 hover:bg-rose-200 dark:bg-rose-800 dark:hover:bg-rose-600"
                onClick={() => dispatch(cancelCreatingSim())}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <p className="mb-2 font-medium">
                Authoring a new sim for run {simsState.selectedRunId}
              </p>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer  bg-rose-300 hover:bg-rose-200 dark:bg-rose-800 dark:hover:bg-rose-600"
                onClick={() => dispatch(cancelCreatingSim())}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
