import type { FlowParamDefinition } from "@lcase/types";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";

type Props = {
  label: string;
  value?: Record<string, FlowParamDefinition>;
};

export function FlowParameters({ label, value }: Props) {
  const entries = value ? Object.entries(value) : [];
  if (entries.length === 0) return null;

  return (
    <Field
      orientation="horizontal"
      className="[&>[data-slot=field-label]]:flex-none items-start"
    >
      <FieldLabel className="w-20 shrink-0 mt-2">{label}</FieldLabel>
      <div className="flex-1 flex flex-col gap-2 mr-3">
        <div className="flex flex-row gap-2">
          <span className="flex-1 text-xs text-muted-foreground">Name</span>
          <span className="flex-1 text-xs text-muted-foreground">Type</span>
          <span className="w-16 shrink-0 text-xs text-muted-foreground">
            Optional
          </span>
        </div>
        {entries.map(([paramName, paramDef]) => (
          <div key={paramName} className="flex flex-row gap-2">
            <Input value={paramName} readOnly className="flex-1" />
            <Input value={paramDef.type} readOnly className="flex-1" />
            <div className="w-16 shrink-0 flex items-center justify-center">
              <Checkbox
                checked={!!paramDef.optional}
                disabled
                className="disabled:opacity-100 border-0 dark:bg-neutral-700 dark:data-[state=checked]:bg-neutral-600 dark:data-[state=checked]:text-neutral-200 dark:data-[state=checked]:border-0"
              />
            </div>
          </div>
        ))}
      </div>
    </Field>
  );
}
