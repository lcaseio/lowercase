import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDetails } from "@/components/EventDetails";
import { FileTextIcon, SettingsIcon, TerminalSquareIcon } from "lucide-react";
import type { AnyEvent, FlowDefinition, Ref, SimRecord } from "@lcase/types";
import type { FlowVersionRunDetailsTab } from "@/lib/run-panel-state.types";
import type { StepRunInfo } from "@/hooks/use-step-run-info";
import type { OpenInMainPanel } from "@/components/MainPanelTypes";
import { StepResultsTab } from "./StepResultsTab";
import { SimSettingsTab } from "./SimSettingsTab";

type Props = {
  activeDetailsTab: FlowVersionRunDetailsTab;
  onActiveDetailsTabChange: (tab: FlowVersionRunDetailsTab) => void;
  selectedEvent: AnyEvent | null;
  selectedStepId: string | null;
  flowDef: FlowDefinition | null;
  refs: Ref[];
  paramHashes: Record<string, string>;
  stepRunInfo: Record<string, StepRunInfo>;
  onOpenInMainPanel: OpenInMainPanel;
  isStepReused?: boolean;
  onToggleStepReused?: () => void;
  simSettings?: { sim: SimRecord | null; parentRunId: string | null };
};

// groups and drives far right panel's tabs selected state
export function FlowVersionRunDetailsPanel({
  activeDetailsTab,
  onActiveDetailsTabChange,
  selectedEvent,
  selectedStepId,
  flowDef,
  refs,
  paramHashes,
  stepRunInfo,
  onOpenInMainPanel,
  isStepReused,
  onToggleStepReused,
  simSettings,
}: Props) {
  return (
    <Tabs
      value={activeDetailsTab}
      onValueChange={(v) =>
        onActiveDetailsTabChange(v as FlowVersionRunDetailsTab)
      }
      className="h-full flex flex-col"
    >
      <TabsList variant="line">
        {simSettings && (
          <TabsTrigger value="settings">
            <SettingsIcon />
            Settings
          </TabsTrigger>
        )}
        <TabsTrigger value="eventDetails">
          <FileTextIcon />
          Event Details
        </TabsTrigger>
        <TabsTrigger value="stepResults">
          <TerminalSquareIcon />
          Step Results
        </TabsTrigger>
      </TabsList>
      {simSettings && (
        <TabsContent value="settings" className="ml-3 mr-3">
          <SimSettingsTab
            sim={simSettings.sim}
            parentRunId={simSettings.parentRunId}
          />
        </TabsContent>
      )}
      <TabsContent value="eventDetails" className="ml-3 mr-3">
        <EventDetails
          event={selectedEvent}
          onOpenInMainPanel={onOpenInMainPanel}
        />
      </TabsContent>
      <TabsContent value="stepResults" className="ml-3 mr-3">
        <StepResultsTab
          stepId={selectedStepId}
          flowDef={flowDef}
          refs={refs}
          paramHashes={paramHashes}
          stepRunInfo={stepRunInfo}
          onOpenInMainPanel={onOpenInMainPanel}
          isReused={isStepReused}
          onToggleReused={onToggleStepReused}
        />
      </TabsContent>
    </Tabs>
  );
}
