import type { StepHttpJson } from "@lcase/types";
import { InputField } from "./InputField";
import { HeadersField } from "./HeadersField";
import { CodeEditorField } from "./CodeEditorField";
import { ExportsField } from "./ExportsField";
import type { OpenInMainPanel } from "./MainPanelTypes";

type Props = {
  step: StepHttpJson;
  stepId: string;
  onOpenInMainPanel: OpenInMainPanel;
};

export function StepHttpJsonDetails({
  step,
  stepId,
  onOpenInMainPanel,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <InputField label="Type" value={step.type} />
      <InputField label="URL" value={step.url} />
      <InputField label="Method" value={step.method} />
      <HeadersField label="Headers" value={step.headers} />
      <InputField label="On Success" value={step.on?.success} />
      <InputField label="On Failure" value={step.on?.failure} />
      <CodeEditorField
        label="Body"
        value={step.body}
        onOpen={(displayValue) =>
          onOpenInMainPanel(`Step "${stepId}" - body`, displayValue, "json")
        }
      />
      <ExportsField
        label="Exports"
        stepId={stepId}
        value={step.exports}
        onOpenInMainPanel={onOpenInMainPanel}
      />
    </div>
  );
}
