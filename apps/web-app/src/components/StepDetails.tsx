import type { FlowDefinition } from "@lcase/types";
import { StepHttpJsonDetails } from "./StepHttpJsonDetails";
import { StepParallelDetails } from "./StepParallelDetails";
import { StepJoinDetails } from "./StepJoinDetails";
import type { OpenInMainPanel } from "./MainPanelTypes";

type Props = {
  flowDef: FlowDefinition | null;
  stepId: string | null;
  onOpenInMainPanel: OpenInMainPanel;
};

export function StepDetails({ stepId, flowDef, onOpenInMainPanel }: Props) {
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
        />
      );
    case "parallel":
      return <StepParallelDetails step={step} />;
    case "join":
      return <StepJoinDetails step={step} />;
    default:
      return <p>No details view for step type "{step.type}" yet</p>;
  }
}
