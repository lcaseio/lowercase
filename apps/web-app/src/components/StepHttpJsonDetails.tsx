import type { StepHttpJson } from "@lcase/types";
import { InputField } from "./InputField";
import { CodeEditor } from "./CodeEditor";
import { Field, FieldLabel } from "./ui/field";

export function StepHttpJsonDetails({ step }: { step: StepHttpJson }) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <InputField label="Type" value={step.type} />
      <InputField label="URL" value={step.url} />
      <InputField label="Method" value={step.method} />
      {step.body !== undefined && (
        <Field
          orientation="horizontal"
          className="[&>[data-slot=field-label]]:flex-none"
        >
          <FieldLabel className="w-20 shrink-0">Body</FieldLabel>
          <div className="flex-1 overflow-hidden rounded-md border dark:border-neutral-700 mr-3">
            <CodeEditor
              value={JSON.stringify(step.body, null, 2)}
              language="json"
              readOnly
            />
          </div>
        </Field>
      )}
    </div>
  );
}
