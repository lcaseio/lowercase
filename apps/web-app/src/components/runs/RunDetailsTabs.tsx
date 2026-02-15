import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RunDetailsFlowViewer } from "./RunDetailsFlowViewer";
import { RunDetailsEventGraph } from "./RunDetailsEventGraph";
import { useAppSelector } from "@/redux/typed-hooks";
import { useGetFlowDefQuery } from "@/redux/api/flows-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSearchParams } from "react-router-dom";
import { getEventGraphRunId } from "@/redux/slices/runner-slice";
import { useGetAllRunEventsQuery } from "@/redux/api/runs-api";
import type { AnyEvent } from "@lcase/types";

type RunDetailsTabsProps = {
  view: "live" | "historical";
};
export function RunDetailsTabs({ view }: RunDetailsTabsProps) {
  const flowRunnerSelectedId = useAppSelector(
    (state) => state.runner.flowSelectedId,
  );

  // runs/details history query string runid and flowdefhash
  const [searchParams] = useSearchParams();
  const runHistoryRunId = searchParams.get("runId");
  const runDetailsFlowDefHash = searchParams.get("flowDefHash");

  const runnerLiveRunId = useAppSelector(getEventGraphRunId);

  const flowId =
    view === "live"
      ? flowRunnerSelectedId
      : view === "historical"
        ? runDetailsFlowDefHash
        : null;

  const runId =
    view === "live"
      ? runnerLiveRunId
      : view === "historical"
        ? runHistoryRunId
        : null;

  const flowDefQuery = useGetFlowDefQuery(flowId ?? skipToken);

  const eventHistory = useGetAllRunEventsQuery(runId ? { runId } : skipToken);

  const wsEvents = useAppSelector((state) => state.events.events);
  const wsRunEventIds = useAppSelector((state) => state.events.runEventIds);

  let events: Record<string, AnyEvent> = {};
  let runEvents: Record<string, string[]> = {};

  if (view === "live") {
    events = wsEvents;
    runEvents = wsRunEventIds;
  } else if (view === "historical" && eventHistory.data?.ok) {
    events = eventHistory.data.events;
    runEvents = eventHistory.data.eventIds;
  }

  return (
    <Tabs defaultValue="flow">
      <TabsList>
        <TabsTrigger value="flow">Flow Chart</TabsTrigger>

        <TabsTrigger value="events">Event Graph</TabsTrigger>
      </TabsList>
      <TabsContent value="flow">
        <RunDetailsFlowViewer
          flowDef={flowDefQuery?.data?.ok ? flowDefQuery.data.value : null}
        />
      </TabsContent>
      <TabsContent value="events">
        <RunDetailsEventGraph
          runId={runId}
          runEvents={runEvents}
          events={events}
        />
      </TabsContent>
    </Tabs>
  );
}
