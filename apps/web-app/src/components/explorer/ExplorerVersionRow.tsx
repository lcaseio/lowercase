import type { FlowVersionRecord } from "@lcase/types";
import { cn } from "@/lib/utils";

export function ExplorerVersionRow({
  version,
  isSelected,
  onSelect,
}: {
  version: FlowVersionRecord;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 pl-10 pr-2 py-1 text-xs cursor-pointer rounded-sm",
        isSelected ? "bg-accent" : "hover:bg-accent/40",
      )}
    >
      <span className="truncate">
        {version.versionLabel ?? `Version ${version.sequence}`}
      </span>
      <span className="text-xs text-muted-foreground ml-auto shrink-0">
        {new Date(version.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}
