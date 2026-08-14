import type { FlowDefinition } from "@lcase/types";
import { StepDetails } from "@/components/steps/StepDetails";

// "Open in main panel" (a big focused-content preview) is an old-page-only
// concept with no equivalent in the new dockview world -- onOpenInMainPanel
// stays a deliberate no-op stub (still used by the deferred reference-
// resolution family, not this tab's own concern). Its httpjson body/exports
// preview buttons instead navigate into the json-definition panel via
// onNavigateToDefinition (PR 28). See docs/UI_WORKSPACE_MILESTONE.md.
export function StepDetailsTab({
  stepId,
  flowDef,
  onNavigateToDefinition,
}: {
  stepId: string | null;
  flowDef: FlowDefinition;
  onNavigateToDefinition: (path: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {stepId && <h2 className="text-lg">{stepId}</h2>}
      <StepDetails
        stepId={stepId}
        flowDef={flowDef}
        onOpenInMainPanel={() => {}}
        onNavigateToDefinition={onNavigateToDefinition}
      />
    </div>
  );
}
