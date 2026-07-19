import { useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { useGetAllRunEventsQuery } from "@/redux/api/runs-api";
import { makeSelectRunEvents } from "@/redux/slices/events-slice";
import {
  enterFlowVersionRunHistoryScope,
  selectFlowVersionRunHistoryState,
  setSelectedRunId,
} from "@/redux/slices/flow-version-run-history-slice";
import { FlowVersionRunHistoryList } from "@/components/flow-version/FlowVersionRunHistoryList";
import { useFlowVersionOutletContext } from "./context";

// run history page for the flow workspace version -- scaffold only, no
// visualization yet, just proving the run list + event backfill pipe works
export function FlowVersionRunHistory() {
  const { flowId, flowVersionId } = useFlowVersionOutletContext();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (flowVersionId && flowId) {
      dispatch(enterFlowVersionRunHistoryScope({ flowVersionId, flowId }));
    }
  }, [dispatch, flowVersionId, flowId]);

  const historyState = useAppSelector((s) =>
    selectFlowVersionRunHistoryState(s, flowVersionId),
  );

  const selectRunEventsRef = useRef(makeSelectRunEvents());
  const events = useAppSelector(
    (s) => selectRunEventsRef.current(s, historyState.selectedRunId),
    shallowEqual,
  );
  const { isFetching } = useGetAllRunEventsQuery(
    historyState.selectedRunId
      ? { runId: historyState.selectedRunId }
      : skipToken,
  );

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border dark:border-neutral-800"
    >
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-875">
        <FlowVersionRunHistoryList
          flowVersionId={flowVersionId}
          selectedRunId={historyState.selectedRunId}
          onSelectRun={(runId) => dispatch(setSelectedRunId(runId))}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="70%" className="dark:bg-neutral-800">
        <div className="p-4 overflow-y-auto h-full">
          {!historyState.selectedRunId ? (
            <p className="text-muted-foreground">
              Select a run to load its events.
            </p>
          ) : isFetching ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : (
            <>
              <p className="mb-2 font-medium">
                {events.length} event{events.length === 1 ? "" : "s"} for run{" "}
                {historyState.selectedRunId}
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {events.map((event, index) => (
                  <li key={event.id} className="font-mono">
                    {index}. {event.type} - {event.time}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
