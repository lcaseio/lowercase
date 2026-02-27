import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RunDetailsFlowViewer } from "./RunDetailsFlowViewer";
import { RunDetailsEventGraph } from "./RunDetailsEventGraph";
import { useRunDetailsData } from "./useRunDetailsData";
import { EventDetails } from "../EventDetails";
import {
  useRunDetailsController,
  type Tab,
} from "./use-run-details-controller";
import { useAppSelector } from "@/redux/typed-hooks";

export type RunDetailsTabsProps = {
  view: "live" | "historical";
};

export function RunDetailsTabs({ view }: RunDetailsTabsProps) {
  const { flowDef, runId, events, runEvents } = useRunDetailsData(view);
  const { activeTab, setActiveTab, selectedEventId } =
    useRunDetailsController();
  const allEvents = useAppSelector((state) => state.events.events);

  const selectedEvent = selectedEventId ? allEvents[selectedEventId] : null;
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
        <TabsTrigger value="artifact">Artifact</TabsTrigger>
      </TabsList>
      <TabsContent value="flow">
        <RunDetailsFlowViewer flowDef={flowDef} />
      </TabsContent>
      <TabsContent value="events">
        <RunDetailsEventGraph
          runId={runId}
          runEvents={runEvents}
          events={events}
        />
      </TabsContent>
      <TabsContent value="details">
        <EventDetails event={selectedEvent} />
      </TabsContent>
      <TabsContent value="artifact">Event Details</TabsContent>
    </Tabs>
  );
}
