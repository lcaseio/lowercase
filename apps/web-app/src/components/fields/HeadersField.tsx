import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type Props = {
  label: string;
  value?: Record<string, string>;
};

export function HeadersField({ label, value }: Props) {
  const entries = value ? Object.entries(value) : [];
  if (entries.length === 0) return null;

  return (
    <Field
      orientation="horizontal"
      className="[&>[data-slot=field-label]]:flex-none items-start"
    >
      <FieldLabel className="w-20 shrink-0">{label}</FieldLabel>
      <div className="flex-1 flex flex-col gap-2 mr-3">
        <div className="flex flex-row gap-2">
          <span className="flex-1 text-xs text-muted-foreground">Key</span>
          <span className="flex-2 text-xs text-muted-foreground">Value</span>
        </div>
        {entries.map(([key, headerValue]) => (
          <div key={key} className="flex flex-row gap-2">
            <Input value={key} readOnly className="flex-1" />
            <Input value={headerValue} readOnly className="flex-2" />
          </div>
        ))}
      </div>
    </Field>
  );
}
