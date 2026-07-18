import { Button } from "@/components/ui/button";
import { Maximize2Icon } from "lucide-react";
import type { OpenInMainPanel } from "@/components/MainPanelTypes";
import { formatBindPath, type ResolvedRef } from "@/lib/ref-resolution";
import { stringifyForPreview, truncateForPreview } from "@/lib/preview-text";

type Props = {
  stepId: string;
  resolvedRef: ResolvedRef;
  onOpenInMainPanel: OpenInMainPanel;
};

export function ReferenceRow({
  stepId,
  resolvedRef,
  onOpenInMainPanel,
}: Props) {
  const { ref, hash, usage } = resolvedRef;
  const label = `{{${ref.string}}}`;
  const fieldPath = formatBindPath(ref.bindPath);

  if (hash === null) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-mono">{label}</div>
        <div className="text-xs text-muted-foreground">in {fieldPath}</div>
        <div className="text-xs text-amber-600 dark:text-amber-400">
          Could not resolve (scope "{ref.scope}" isn't resolvable yet).
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-mono">{label}</div>
        <div className="text-xs text-muted-foreground">
          in {fieldPath} — loading…
        </div>
      </div>
    );
  }

  if (!usage.resolved) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-mono">{label}</div>
        <div className="text-xs text-muted-foreground">in {fieldPath}</div>
        <div className="text-xs text-amber-600 dark:text-amber-400">
          Could not resolve against the loaded artifact.
        </div>
      </div>
    );
  }

  const resolvedText = stringifyForPreview(usage.resolvedValue);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-mono">{label}</div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() =>
            onOpenInMainPanel(
              `Step "${stepId}" reference: ${ref.string}`,
              resolvedText,
              typeof usage.resolvedValue === "string" ? "plaintext" : "json",
            )
          }
          title="Open full resolved value in main tab"
        >
          <Maximize2Icon className="size-3.5" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">in {fieldPath}</div>
      <pre className="text-xs whitespace-pre-wrap break-words rounded bg-neutral-100 dark:bg-neutral-900 p-2">
        {truncateForPreview(resolvedText)}
      </pre>
    </div>
  );
}
