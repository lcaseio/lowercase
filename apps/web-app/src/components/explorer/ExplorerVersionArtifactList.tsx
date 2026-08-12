import type { ArtifactListItem } from "@lcase/types";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { cn } from "@/lib/utils";
import { ARTIFACT_ICON, ARTIFACT_ICON_CLASS } from "./explorer-tab-icons";
import { titleFor } from "./artifact-title";

// Scoped to one flow version's own curated artifacts -- no flow-wide
// "shared" artifacts included (no way to create more than one version of a
// flow yet, so that distinction has no real case to serve today). Every row
// is clickable, including bytes-format ones -- PR 22 kept those inert since
// there was nothing to view, but PR 23's metadata tab gives them something
// real to show even without a content preview.
export function ExplorerVersionArtifactList({
  versionId,
  selectedRowId,
  onSelectArtifact,
}: {
  versionId: string;
  selectedRowId: string | null;
  onSelectArtifact: (item: ArtifactListItem, versionId: string) => void;
}) {
  const { data, isLoading } = useListArtifactsQuery({
    flowVersionId: versionId,
    curated: "true",
  });

  if (isLoading)
    return (
      <div className="pl-20 py-0.5 text-xs text-muted-foreground">
        Loading artifacts...
      </div>
    );
  if (!data?.ok)
    return (
      <div className="pl-20 py-0.5 text-xs text-destructive">
        Error loading artifacts
      </div>
    );
  if (data.value.length === 0)
    return (
      <div className="pl-20 py-0.5 text-xs text-muted-foreground">
        No artifacts yet.
      </div>
    );

  const artifacts = [...data.value].sort(
    (a, b) =>
      new Date(b.artifact.time).getTime() - new Date(a.artifact.time).getTime(),
  );

  return (
    <>
      {artifacts.map((item) => {
        const isSelected = selectedRowId === `artifact:${item.artifact.hash}`;
        return (
          <div
            key={item.artifact.hash}
            onClick={() => onSelectArtifact(item, versionId)}
            className={cn(
              "flex items-center gap-2 pl-20 pr-2 py-0.5 text-xs cursor-pointer",
              isSelected ? "bg-accent" : "hover:bg-accent/40",
            )}
          >
            <ARTIFACT_ICON
              className={cn("size-3.5 shrink-0", ARTIFACT_ICON_CLASS)}
            />
            <span className="truncate">{titleFor(item)}</span>
          </div>
        );
      })}
    </>
  );
}
