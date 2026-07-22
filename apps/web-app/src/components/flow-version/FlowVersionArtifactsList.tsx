import { useMemo } from "react";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { cn } from "@/lib/utils";
import { Item, ItemContent, ItemDescription, ItemTitle } from "../ui/item";

type FlowVersionArtifactsListProps = {
  flowVersionId: string | null;
  selectedHash: string | null;
  onSelectArtifact: (hash: string) => void;
};

export function FlowVersionArtifactsList({
  flowVersionId,
  selectedHash,
  onSelectArtifact,
}: FlowVersionArtifactsListProps) {
  const { data, isLoading } = useListArtifactsQuery(
    flowVersionId ? { flowVersionId, curated: "true" } : undefined,
  );

  const artifacts = useMemo(
    () =>
      data?.ok
        ? [...data.value].sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
          )
        : [],
    [data],
  );

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      {isLoading ? (
        <div className="p-4 text-muted-foreground">Loading artifacts...</div>
      ) : artifacts.length === 0 ? (
        <div className="p-4 text-muted-foreground">No artifacts yet.</div>
      ) : (
        artifacts.map((artifact) => (
          <button
            key={artifact.hash}
            type="button"
            onClick={() => onSelectArtifact(artifact.hash)}
            className={cn(
              "text-left cursor-pointer",
              artifact.hash === selectedHash &&
                "ring-2 ring-sky-500 rounded-md",
            )}
          >
            <Item variant="muted">
              <ItemContent>
                <ItemTitle className="text-xs">
                  {artifact.label ||
                    artifact.filename ||
                    `${artifact.hash.slice(0, 10)}...`}
                </ItemTitle>
                <ItemDescription className="line-clamp-1">
                  {artifact.format}
                </ItemDescription>
                <ItemDescription className="line-clamp-1">
                  {new Date(artifact.time).toLocaleString()}
                </ItemDescription>
              </ItemContent>
            </Item>
          </button>
        ))
      )}
    </div>
  );
}
