import { useAppSelector } from "@/redux/typed-hooks";
import type { RunDetailsTabsProps } from "./RunDetailsTabs";
import { useSearchParams } from "react-router-dom";
import { useGetFlowDefQuery } from "@/redux/api/flows-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetAllRunEventsQuery } from "@/redux/api/runs-api";
import type { AnyEvent } from "@lcase/types";
import { getEventGraphRunId } from "@/redux/slices/runner-slice";

export function useRunDetailsData(view: RunDetailsTabsProps["view"]) {
  const runnerFlowId = useAppSelector((state) => state.runner.flowSelectedId);

  // runs/details history query string runId and flowDefHash
  const runHistoryParams = useRunDetailsHistoryParams();
  const runnerRunId = useAppSelector(getEventGraphRunId);

  const isLiveView = view === "live";
  const runId = pickValue(isLiveView, runnerRunId, runHistoryParams.runId);
  const flowId = pickValue(
    isLiveView,
    runnerFlowId,
    runHistoryParams.flowDefHash,
  );

  const flowDefQuery = useGetFlowDefQuery(flowId ?? skipToken);

  // REST endpoint for historical events
  const eventHistory = useGetAllRunEventsQuery(
    !isLiveView && runId ? { runId } : skipToken,
  );

  // WebSocket for live events
  const wsEvents = useAppSelector((state) => state.events.events);
  const wsRunEventIds = useAppSelector((state) => state.events.runEventIds);

  // use WebSocket events for live view, REST for historical
  const events: Record<string, AnyEvent> = isLiveView
    ? wsEvents
    : eventHistory.data?.ok
      ? eventHistory.data.events
      : {};

  const runEvents: Record<string, string[]> = isLiveView
    ? wsRunEventIds
    : eventHistory.data?.ok
      ? eventHistory.data.eventIds
      : {};

  const flowDef = flowDefQuery?.data?.ok ? flowDefQuery.data.value : null;

  return {
    flowDef,
    runId,
    events,
    runEvents,
  };
}

// testing abstracting out ternaries
function pickValue<T>(isLive: boolean, liveValue: T, historicalValue: T) {
  return isLive ? liveValue : historicalValue;
}

function useRunDetailsHistoryParams() {
  const [searchParams] = useSearchParams();
  const runHistoryRunId = searchParams.get("runId");
  const runDetailsFlowDefHash = searchParams.get("flowDefHash");
  return { runId: runHistoryRunId, flowDefHash: runDetailsFlowDefHash };
}
