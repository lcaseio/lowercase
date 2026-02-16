import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RunDetailsFlowViewer } from "./RunDetailsFlowViewer";
import { RunDetailsEventGraph } from "./RunDetailsEventGraph";
import { useRunDetailsData } from "./useRunDetailsData";

export type RunDetailsTabsProps = {
  view: "live" | "historical";
};

export function RunDetailsTabs({ view }: RunDetailsTabsProps) {
  const { flowDef, runId, events, runEvents } = useRunDetailsData(view);

  return (
    <Tabs defaultValue="flow">
      <TabsList>
        <TabsTrigger value="flow">Flow Chart</TabsTrigger>

        <TabsTrigger value="events">Event Graph</TabsTrigger>
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
    </Tabs>
  );
}
