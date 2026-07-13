import { Field, FieldLabel } from "./ui/field";
import { CodeEditor } from "./CodeEditor";

type Props = {
  label: string;
  value?: unknown;
  language?: "json" | "markdown" | "plaintext";
};

export function CodeEditorField({ label, value, language = "json" }: Props) {
  if (value === undefined) return null;

  return (
    <Field
      orientation="horizontal"
      className="[&>[data-slot=field-label]]:flex-none"
    >
      <FieldLabel className="w-20 shrink-0">{label}</FieldLabel>
      <div className="flex-1 overflow-hidden rounded-md border dark:border-neutral-700 mr-3">
        <CodeEditor
          value={
            typeof value === "string" ? value : JSON.stringify(value, null, 2)
          }
          language={language}
          readOnly
        />
      </div>
    </Field>
  );
}
