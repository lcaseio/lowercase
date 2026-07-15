import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowGraph } from "@/components/FlowGraph";
import { CodeEditor } from "@/components/CodeEditor";
import { CurlyBracesIcon, NetworkIcon } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { FlowDefinition } from "@lcase/types";
import type { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import type { MainPanelLanguage } from "@/components/MainPanelTypes";

type FocusedContent = {
  title: string;
  value: string;
  language: MainPanelLanguage;
};

type Props = {
  flowDef: FlowDefinition | null;
  flowAnalysis: ReturnType<typeof useFlowAnalysis>;
  activeMainTab: string;
  onActiveMainTabChange: (tab: string) => void;
  focusedContent: FocusedContent | null;
  onNodeClick: (node: Node) => void;
};

export function FlowVersionGraphPanel({
  flowDef,
  flowAnalysis,
  activeMainTab,
  onActiveMainTabChange,
  focusedContent,
  onNodeClick,
}: Props) {
  return (
    <Tabs
      value={activeMainTab}
      onValueChange={onActiveMainTabChange}
      className="h-full flex flex-col"
    >
      <TabsList variant="line">
        <TabsTrigger value="list">
          <NetworkIcon />
          Graph
        </TabsTrigger>
        <TabsTrigger value="create">
          <CurlyBracesIcon />
          JSON
        </TabsTrigger>
        {focusedContent && (
          <TabsTrigger value="focused">{focusedContent.title}</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="list" className="flex-1 min-h-0 dark:bg-panel-subtle">
        {flowDef ? (
          <FlowGraph
            flowDef={flowDef}
            layout={flowAnalysis?.layout ?? null}
            outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
            onNodeClickHandler={onNodeClick}
          ></FlowGraph>
        ) : (
          "invalid flow def"
        )}
      </TabsContent>
      <TabsContent value="create">
        {flowDef && (
          <CodeEditor
            language="json"
            value={JSON.stringify(flowDef, null, 2)}
            height="100%"
            readOnly
          />
        )}
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
