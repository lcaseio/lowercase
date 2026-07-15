import { Field, FieldLabel } from "../ui/field";
import { CodeEditor } from "../CodeEditor";
import { Button } from "../ui/button";
import { Maximize2Icon } from "lucide-react";

type Props = {
  label: string;
  value?: unknown;
  language?: "json" | "markdown" | "plaintext";
  onOpen?: (displayValue: string) => void;
};

export function CodeEditorField({
  label,
  value,
  language = "json",
  onOpen,
}: Props) {
  if (value === undefined) return null;

  const displayValue =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <Field
      orientation="horizontal"
      className="[&>[data-slot=field-label]]:flex-none"
    >
      <FieldLabel className="w-20 shrink-0">{label}</FieldLabel>
      {onOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="size-5 shrink-0"
          onClick={() => onOpen(displayValue)}
        >
          <Maximize2Icon className="size-3.5" />
        </Button>
      )}
      <div className="flex-1 overflow-hidden rounded-md border dark:border-neutral-700 mr-3">
        <CodeEditor value={displayValue} language={language} readOnly />
      </div>
    </Field>
  );
}
