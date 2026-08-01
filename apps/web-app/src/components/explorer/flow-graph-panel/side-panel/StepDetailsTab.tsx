import type { FlowDefinition } from "@lcase/types";
import { StepDetails } from "@/components/steps/StepDetails";

// "Open in main panel" (a big focused-content preview) is an old-page-only
// concept with no equivalent in the new dockview world yet -- StepDetails
// requires the prop (only used by its httpjson preview buttons), so this is
// a deliberate no-op stub, not an oversight. See docs/todo.md.
export function StepDetailsTab({
  stepId,
  flowDef,
}: {
  stepId: string | null;
  flowDef: FlowDefinition;
}) {
  return (
    <div className="flex flex-col gap-2">
      {stepId && <h2 className="text-lg">{stepId}</h2>}
      <StepDetails
        stepId={stepId}
        flowDef={flowDef}
        onOpenInMainPanel={() => {}}
      />
    </div>
  );
}
