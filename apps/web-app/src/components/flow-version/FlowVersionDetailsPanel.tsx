import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepDetails } from "@/components/steps/StepDetails";
import { FlowSettings } from "@/components/FlowSettings";
import { FlowParameters } from "@/components/FlowParameters";
import { FlowProblemsList } from "@/components/FlowProblemsList";
import {
  CircleAlertIcon,
  Footprints,
  Settings2Icon,
  VariableIcon,
} from "lucide-react";
import type { FlowDefinition, FlowProblem } from "@lcase/types";
import type { OpenInMainPanel } from "@/components/MainPanelTypes";

type Props = {
  flowDef: FlowDefinition | null;
  problems: FlowProblem[];
  activeDetailsTab: string;
  onActiveDetailsTabChange: (tab: string) => void;
  selectedStepId: string | null;
  onOpenInMainPanel: OpenInMainPanel;
};

export function FlowVersionDetailsPanel({
  flowDef,
  problems,
  activeDetailsTab,
  onActiveDetailsTabChange,
  selectedStepId,
  onOpenInMainPanel,
}: Props) {
  return (
    <Tabs
      value={activeDetailsTab}
      onValueChange={onActiveDetailsTabChange}
      className="h-full flex flex-col"
    >
      <TabsList variant="line">
        <TabsTrigger value="settings">
          <Settings2Icon />
          Settings
        </TabsTrigger>
        <TabsTrigger value="params">
          <VariableIcon />
          Parameters
        </TabsTrigger>
        <TabsTrigger value="details">
          <Footprints />
          Step Details
        </TabsTrigger>

        <TabsTrigger value="problems">
          <CircleAlertIcon />
          Problems{" "}
          {problems.length >= 1 ? (
            <span className="text-xs font-normal rounded px-1.5 py-0.5 bg-cyan-900 text-cyan-100">
              {problems.length}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="flex-1 min-h-0 ml-3 mr-3">
        {flowDef && (
          <FlowSettings
            name={flowDef.name}
            start={flowDef.start}
            version={flowDef.version}
            description={flowDef.description}
            kind={flowDef.kind}
          />
        )}
      </TabsContent>
      <TabsContent value="params" className="ml-3 mr-3 flex flex-col">
        <FlowParameters label="Params" value={flowDef?.params} />
      </TabsContent>
      <TabsContent value="details" className="ml-3 mr-3">
        <h2 className="mt-3 text-lg">{selectedStepId}</h2>
        <StepDetails
          stepId={selectedStepId}
          flowDef={flowDef}
          onOpenInMainPanel={onOpenInMainPanel}
        />
      </TabsContent>

      <TabsContent value="problems" className="ml-3 mr-3">
        <h2 className="mt-3 mb-3 text-lg">Flow Analysis Problems</h2>
        <FlowProblemsList problems={problems} />
      </TabsContent>
    </Tabs>
  );
}
