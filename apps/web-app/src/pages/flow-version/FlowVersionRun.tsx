import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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

export function FlowVersionRun() {
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
      <ResizablePanel defaultSize="20%" className="pl-5 dark:bg-neutral-875">
        <h2>Run Flow</h2>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
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
