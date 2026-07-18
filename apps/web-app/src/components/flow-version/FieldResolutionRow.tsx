import type { FlowDefinition } from "@lcase/types";
import { Button } from "@/components/ui/button";
import { Maximize2Icon } from "lucide-react";
import type { OpenInMainPanel } from "@/components/MainPanelTypes";
import { foldResolvedField, type ResolvedRef } from "@/lib/ref-resolution";
import { stringifyForPreview, truncateForPreview } from "@/lib/preview-text";

type Props = {
  stepId: string;
  flowDef: FlowDefinition;
  bindPath: string;
  group: ResolvedRef[];
  onOpenInMainPanel: OpenInMainPanel;
};

// displays one field before and after references were resolved and bound
export function FieldResolutionRow({
  stepId,
  flowDef,
  bindPath,
  group,
  onOpenInMainPanel,
}: Props) {
  const { originalField, value, anyUnresolved, anyLoading } = foldResolvedField(
    flowDef,
    stepId,
    group[0].ref.bindPath,
    group,
  );
  const originalText = stringifyForPreview(originalField);
  const resolvedText = stringifyForPreview(value);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-medium">{bindPath}</div>
      <div className="text-xs text-muted-foreground">Before</div>
      <pre className="text-xs whitespace-pre-wrap break-words rounded bg-neutral-100 dark:bg-neutral-900 p-2">
        {truncateForPreview(originalText)}
      </pre>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">After</div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() =>
            onOpenInMainPanel(
              `Step "${stepId}" — ${bindPath}`,
              resolvedText,
              typeof value === "string" ? "plaintext" : "json",
            )
          }
          title="Open full resolved value in main tab"
        >
          <Maximize2Icon className="size-3.5" />
        </Button>
      </div>
      <pre className="text-xs whitespace-pre-wrap break-words rounded bg-neutral-100 dark:bg-neutral-900 p-2">
        {truncateForPreview(resolvedText)}
      </pre>
      {anyUnresolved ? (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          Could not resolve one or more references in this field.
        </div>
      ) : null}
      {anyLoading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : null}
    </div>
  );
}
