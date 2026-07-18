import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowGraph } from "@/components/FlowGraph";
import { EventGraph } from "@/components/EventGraph";
import { CodeEditor } from "@/components/CodeEditor";
import { ChartNoAxesGanttIcon, NetworkIcon } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { AnyEvent, FlowDefinition } from "@lcase/types";
import type { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import type {
  FlowVersionRunFocusedContent,
  FlowVersionRunMainTab,
} from "@/redux/slices/flow-version-run-slice";
import type { StepStatus } from "@/hooks/use-step-run-info";

type Props = {
  flowDef: FlowDefinition | null;
  flowAnalysis: ReturnType<typeof useFlowAnalysis>;
  activeMainTab: FlowVersionRunMainTab;
  onActiveMainTabChange: (tab: FlowVersionRunMainTab) => void;
  onNodeClick: (node: Node) => void;
  events: AnyEvent[];
  selectedEventId: string | null;
  onEventClick: (eventId: string) => void;
  focusedContent: FlowVersionRunFocusedContent | null;
  stepStatuses: Record<string, StepStatus>;
};

// main pane in run page used to display in tabs the flow chart + event graph
export function FlowVersionRunGraphPanel({
  flowDef,
  flowAnalysis,
  activeMainTab,
  onActiveMainTabChange,
  onNodeClick,
  events,
  selectedEventId,
  onEventClick,
  focusedContent,
  stepStatuses,
}: Props) {
  return (
    <Tabs
      value={activeMainTab}
      onValueChange={(v) => onActiveMainTabChange(v as FlowVersionRunMainTab)}
      className="h-full flex flex-col"
    >
      <TabsList variant="line">
        <TabsTrigger value="graph">
          <NetworkIcon />
          Flow Chart
        </TabsTrigger>
        <TabsTrigger value="events">
          <ChartNoAxesGanttIcon />
          Event Graph
        </TabsTrigger>
        {focusedContent && (
          <TabsTrigger value="focused">{focusedContent.title}</TabsTrigger>
        )}
      </TabsList>
      <TabsContent
        value="graph"
        className="flex-1 min-h-0 dark:bg-panel-subtle"
      >
        {flowDef ? (
          <FlowGraph
            flowDef={flowDef}
            layout={flowAnalysis?.layout ?? null}
            outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
            onNodeClickHandler={onNodeClick}
            stepStatuses={stepStatuses}
          ></FlowGraph>
        ) : (
          "invalid flow def"
        )}
      </TabsContent>
      <TabsContent value="events" className="flex-1 min-h-0">
        <EventGraph
          events={events}
          selectedEventId={selectedEventId}
          onEventClick={onEventClick}
        />
      </TabsContent>
      {focusedContent && (
        <TabsContent value="focused" className="flex-1 min-h-0">
          <CodeEditor
            language={focusedContent.language}
            value={focusedContent.value}
            height="100%"
            readOnly
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
