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

  const items = useMemo(
    () =>
      data?.ok
        ? [...data.value].sort(
            (a, b) =>
              new Date(b.artifact.time).getTime() -
              new Date(a.artifact.time).getTime(),
          )
        : [],
    [data],
  );

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      {isLoading ? (
        <div className="p-4 text-muted-foreground">Loading artifacts...</div>
      ) : items.length === 0 ? (
        <div className="p-4 text-muted-foreground">No artifacts yet.</div>
      ) : (
        items.map((item) => (
          <button
            key={item.artifact.hash}
            type="button"
            onClick={() => onSelectArtifact(item.artifact.hash)}
            className={cn(
              "text-left cursor-pointer",
              item.artifact.hash === selectedHash &&
                "ring-2 ring-sky-500 rounded-md",
            )}
          >
            <Item variant="muted">
              <ItemContent>
                <ItemTitle className="text-xs">
                  {item.artifact.label ||
                    item.artifact.filename ||
                    `${item.artifact.hash.slice(0, 10)}...`}
                </ItemTitle>
                <ItemDescription className="line-clamp-1 text-xs"></ItemDescription>

                {item.associations.paramCurations.length > 0 && (
                  <ItemDescription className="line-clamp-1 text-xs">
                    {item.associations.paramCurations
                      .map((pc) => pc.paramName)
                      .join(", ")}
                  </ItemDescription>
                )}

                <ItemDescription className="line-clamp-1 text-xs flex flex-row justify-between">
                  <p>{item.artifact.format}</p>
                  <p>{new Date(item.artifact.time).toLocaleString()}</p>
                </ItemDescription>
              </ItemContent>
            </Item>
          </button>
        ))
      )}
    </div>
  );
}
