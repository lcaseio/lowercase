import type {
  ArtifactListItem,
  FlowDefinition,
  FlowParamDefinition,
  FlowProblem,
  FlowVersionRecord,
} from "@lcase/types";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { ParamsTab } from "./side-panel/ParamsTab";
import { SimTab } from "./side-panel/SimTab";
import { ProblemsTab } from "./side-panel/ProblemsTab";
import { ParametersTab } from "./side-panel/ParametersTab";
import { StepDetailsTab } from "./side-panel/StepDetailsTab";
import { SettingsTab } from "./side-panel/SettingsTab";

export type SidePanelTab =
  "runinput" | "sim" | "problems" | "parameters" | "stepdetails" | "settings";

const TAB_LABELS: Record<SidePanelTab, string> = {
  runinput: "Run Input",
  sim: "Sim",
  problems: "Problems",
  parameters: "Parameters",
  stepdetails: "Step Details",
  settings: "Settings",
};

type Props = {
  activeTab: SidePanelTab;
  onClose: () => void;
  flowDef: FlowDefinition;
  params: Record<string, FlowParamDefinition>;
  artifacts: ArtifactListItem[];
  selectedParamHashes: Record<string, string>;
  onParamChange: (name: string, hash: string | undefined) => void;
  missingRequiredParams: string[];
  problems: FlowProblem[];
  selectedStepId: string | null;
  version: FlowVersionRecord;
};

// scoped to the Flow Graph tab only -- own local tab state (owned by the
// caller, same fully-controlled shape as FlowVersionRunDetailsPanel), not
// the main Explorer tab registry in explorer-tabs-slice.ts. Tab switching
// itself lives in the sibling Rail; this component only ever mounts once a
// tab is already active. Thin dispatcher, same shape as ExplorerTabContent
// one level up -- each tab's actual body lives in its own file under
// side-panel/, not inlined here, so this doesn't grow into a big ternary as
// more tabs (Problems, Parameters, ...) land.
export function SidePanel({
  activeTab,
  onClose,
  flowDef,
  params,
  artifacts,
  selectedParamHashes,
  onParamChange,
  missingRequiredParams,
  problems,
  selectedStepId,
  version,
}: Props) {
  function renderTab() {
    switch (activeTab) {
      case "runinput":
        return (
          <ParamsTab
            flowDef={flowDef}
            params={params}
            artifacts={artifacts}
            selectedParamHashes={selectedParamHashes}
            onParamChange={onParamChange}
            missingRequiredParams={missingRequiredParams}
          />
        );
      case "sim":
        return <SimTab />;
      case "problems":
        return <ProblemsTab problems={problems} />;
      case "parameters":
        return <ParametersTab params={params} />;
      case "stepdetails":
        return <StepDetailsTab stepId={selectedStepId} flowDef={flowDef} />;
      case "settings":
        return <SettingsTab version={version} start={flowDef.start} />;
      default: {
        const _exhaustive: never = activeTab;
        return _exhaustive;
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between  py-1.5">
        <span className="text-sm font-medium">{TAB_LABELS[activeTab]}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 cursor-pointer"
          onClick={onClose}
          title="Close panel"
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3">{renderTab()}</div>
    </div>
  );
}
