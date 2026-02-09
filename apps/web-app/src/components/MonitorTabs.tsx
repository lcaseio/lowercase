import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MonitorTabs() {
  return (
    <div>
      <Tabs defaultValue="Graph">
        <TabsList variant="line">
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
