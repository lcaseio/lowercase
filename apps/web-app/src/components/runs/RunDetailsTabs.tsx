import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RunDetailsFlowViewer } from "./RunDetailsFlowViewer";
import { RunDetailsEventGraph } from "./RunDetailsEventGraph";
import { EventDetails } from "../EventDetails";
import {
  useRunDetailsController,
  type Tab,
} from "./use-run-details-controller";
import { useAppSelector } from "@/redux/typed-hooks";
import { useGetFlowDefQuery } from "@/redux/api/flows-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetAllRunEventsQuery } from "@/redux/api/runs-api";
import { useRef } from "react";
import {
  makeSelectRunEvents,
  selectEventById,
} from "@/redux/slices/events-slice";
import { shallowEqual } from "react-redux";
import { RunArtifactList } from "./RunArtifactList";
import { RunArtifactViewer } from "./RunArtifactViewer";

export type RunDetailsTabsProps = {
  view: "live" | "historical";
};

export function RunDetailsTabs({ view }: RunDetailsTabsProps) {
  const { activeTab, setActiveTab, selectedEventId, runId, flowDefHash } =
    useRunDetailsController();
  // const allEvents = useAppSelector((state) => state.events.events);

  // use ref
  const selectRunEventsRef = useRef(makeSelectRunEvents());
  const events = useAppSelector(
    (s) => selectRunEventsRef.current(s, runId),
    shallowEqual,
  );

  const flowDefQuery = useGetFlowDefQuery(flowDefHash ?? skipToken);
  const flowDef = flowDefQuery?.data?.ok ? flowDefQuery.data.value : null;

  useGetAllRunEventsQuery(runId ? { runId } : skipToken);

  const selectedEvent = useAppSelector((s) =>
    selectEventById(s, selectedEventId),
  );

  return (
    <Tabs
      defaultValue="flow"
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as Tab)}
    >
      <TabsList>
        <TabsTrigger value="flow">Flow Chart</TabsTrigger>

        <TabsTrigger value="events">Event Graph</TabsTrigger>
        <TabsTrigger value="details">Event Details</TabsTrigger>

        {view === "historical" ? (
          <>
            <TabsTrigger value="artifacts">Artifact List</TabsTrigger>
            <TabsTrigger value="artifactViewer">Artifact Viewer</TabsTrigger>
          </>
        ) : null}
      </TabsList>
      <TabsContent value="flow">
        <RunDetailsFlowViewer flowDef={flowDef} />
      </TabsContent>
      <TabsContent value="events">
        <RunDetailsEventGraph events={events} />
      </TabsContent>
      <TabsContent value="details">
        <EventDetails event={selectedEvent} />
      </TabsContent>
      {view === "historical" ? (
        <>
          <TabsContent value="artifacts">
            <RunArtifactList runId={runId} />
          </TabsContent>
          <TabsContent value="artifactViewer">
            <RunArtifactViewer />
          </TabsContent>
        </>
      ) : null}
    </Tabs>
  );
}
