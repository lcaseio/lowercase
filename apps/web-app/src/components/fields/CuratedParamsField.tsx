import type { FlowParamDefinition } from "@lcase/types";
import { Field, FieldLabel } from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

type Props = {
  label: string;
  params?: Record<string, FlowParamDefinition>;
  curatedParamNames: string[];
  onToggleParam?: (paramName: string, checked: boolean) => void;
};

export function CuratedParamsField({
  label,
  params,
  curatedParamNames,
  onToggleParam,
}: Props) {
  const entries = params ? Object.keys(params) : [];
  if (entries.length === 0) return null;

  const curated = new Set(curatedParamNames);

  return (
    <Field
      orientation="horizontal"
      className="[&>[data-slot=field-label]]:flex-none items-start"
    >
      <FieldLabel className="w-20 shrink-0 mt-2">{label}</FieldLabel>
      <div className="flex-1 flex flex-col gap-2 mr-3">
        {entries.map((paramName) => (
          <div key={paramName} className="flex items-center gap-2">
            <Checkbox
              id={`param-${paramName}`}
              checked={curated.has(paramName)}
              onCheckedChange={
                onToggleParam
                  ? (checked) => onToggleParam(paramName, !!checked)
                  : undefined
              }
              disabled={!onToggleParam}
            />
            <Label
              htmlFor={`param-${paramName}`}
              className="text-sm font-normal"
            >
              {paramName}
            </Label>
          </div>
        ))}
      </div>
    </Field>
  );
}
