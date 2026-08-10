import type { ArtifactListItem } from "@lcase/types";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { cn } from "@/lib/utils";
import { ARTIFACT_ICON, ARTIFACT_ICON_CLASS } from "./explorer-tab-icons";

function titleFor(item: ArtifactListItem) {
  return (
    item.artifact.label ||
    item.artifact.filename ||
    `${item.artifact.hash.slice(0, 10)}...`
  );
}

// Scoped to one flow version's own curated artifacts -- no flow-wide
// "shared" artifacts included (no way to create more than one version of a
// flow yet, so that distinction has no real case to serve today). Rows are
// deliberately static: no click-to-open yet, since there's no dockview
// panel kind for artifacts -- a separate, larger piece.
export function ExplorerVersionArtifactList({
  versionId,
}: {
  versionId: string;
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
      {artifacts.map((item) => (
        <div
          key={item.artifact.hash}
          className="flex items-center gap-2 pl-20 pr-2 py-0.5 text-xs"
        >
          <ARTIFACT_ICON
            className={cn("size-3.5 shrink-0", ARTIFACT_ICON_CLASS)}
          />
          <span className="truncate">{titleFor(item)}</span>
        </div>
      ))}
    </>
  );
}
