import type { FlowDefinition } from "@lcase/types";
import { StepHttpJsonDetails } from "./StepHttpJsonDetails";
import { StepParallelDetails } from "./StepParallelDetails";
import { StepJoinDetails } from "./StepJoinDetails";
import { StepBranchDetails } from "./StepBranchDetails";
import { StepMcpDetails } from "./StepMcpDetails";
import type { OpenInMainPanel } from "../MainPanelTypes";

type Props = {
  flowDef: FlowDefinition | null;
  stepId: string | null;
  onOpenInMainPanel: OpenInMainPanel;
  onNavigateToDefinition?: (path: string[]) => void;
};

export function StepDetails({
  stepId,
  flowDef,
  onOpenInMainPanel,
  onNavigateToDefinition,
}: Props) {
  if (!stepId || !flowDef) return <p>Select a stepid / flow definition</p>;
  const step = flowDef.steps[stepId];
  if (!step) return <p>Select a valid stepId</p>;

  switch (step.type) {
    case "httpjson":
      return (
        <StepHttpJsonDetails
          step={step}
          stepId={stepId}
          onOpenInMainPanel={onOpenInMainPanel}
          onNavigateToDefinition={onNavigateToDefinition}
        />
      );
    case "parallel":
      return <StepParallelDetails step={step} />;
    case "join":
      return <StepJoinDetails step={step} />;
    case "branch":
      return <StepBranchDetails step={step} />;
    case "mcp":
      return <StepMcpDetails step={step} />;
  }
}
