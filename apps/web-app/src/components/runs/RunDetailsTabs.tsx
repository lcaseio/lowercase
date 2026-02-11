import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RunDetailsFlowViewer } from "./RunDetailsFlowViewer";
import { RunDetailsEventGraph } from "./RunDetailsEventGraph";
import { useAppSelector } from "@/redux/typed-hooks";
import { useGetFlowDefQuery } from "@/redux/api/flows-api";
import { skipToken } from "@reduxjs/toolkit/query";

export function RunDetailsTabs() {
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);
  const flowDefQuery = useGetFlowDefQuery(flowSelectedId ?? skipToken);
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
        <RunDetailsEventGraph />
      </TabsContent>
    </Tabs>
  );
}
