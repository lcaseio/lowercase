import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FlowVersionList } from "@/components/FlowVersionList";
import { FlowVersionGraphPanel } from "@/components/flow-version/FlowVersionGraphPanel";
import { FlowVersionDetailsPanel } from "@/components/flow-version/FlowVersionDetailsPanel";
import type { Node } from "@xyflow/react";
import type {
  MainPanelLanguage,
  OpenInMainPanel,
} from "@/components/MainPanelTypes";
import { useFlowVersionOutletContext } from "./context";

type FocusedContent = {
  title: string;
  value: string;
  language: MainPanelLanguage;
};

export function FlowVersionView() {
  const { flowDef, flowAnalysis } = useFlowVersionOutletContext();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState("settings");
  const [activeMainTab, setActiveMainTab] = useState("list");
  const [focusedContent, setFocusedContent] = useState<FocusedContent | null>(
    null,
  );

  const problems = flowAnalysis?.flowAnalysis.problems ?? [];

  function handleNodeClick(node: Node) {
    setSelectedStepId(node.id);
    setActiveDetailsTab("details");
  }

  const openInMainPanel: OpenInMainPanel = (title, value, language) => {
    setFocusedContent({ title, value, language });
    setActiveMainTab("focused");
  };

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border dark:border-neutral-800"
    >
      <ResizablePanel defaultSize="10%" className="pl-5 dark:bg-neutral-875">
        <FlowVersionList
          flowName="Parallel Flow Test"
          kind="business"
          versions={[
            {
              id: "version id",
              flowId: "version flow id",
              sequence: 0,
              definitionHash: "definition hash",
              createdAt: "created At",
            },
            {
              id: "version id",
              flowId: "version flow id",
              sequence: 1,
              definitionHash: "definition hash",
              createdAt: "created At",
              versionLabel: "Green Frog",
            },
          ]}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%">
        <FlowVersionGraphPanel
          flowDef={flowDef}
          flowAnalysis={flowAnalysis}
          activeMainTab={activeMainTab}
          onActiveMainTabChange={setActiveMainTab}
          focusedContent={focusedContent}
          onNodeClick={handleNodeClick}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        <FlowVersionDetailsPanel
          flowDef={flowDef}
          problems={problems}
          activeDetailsTab={activeDetailsTab}
          onActiveDetailsTabChange={setActiveDetailsTab}
          selectedStepId={selectedStepId}
          onOpenInMainPanel={openInMainPanel}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
