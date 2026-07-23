import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type Props = {
  label: string;
  value?: string;
  error?: string;
  description?: string;
  onChange?: (value: string) => void;
};

export function InputField({
  label,
  value,
  description,
  error,
  onChange,
}: Props) {
  if (value === undefined) return null;
  return (
    <Field
      orientation="horizontal"
      className="[&>[data-slot=field-label]]:flex-none"
    >
      <FieldLabel htmlFor={label} className="w-20 shrink-0">
        {label}
      </FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
      <Input
        id={label}
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        className="flex-1 mr-3"
      />
    </Field>
  );
}
