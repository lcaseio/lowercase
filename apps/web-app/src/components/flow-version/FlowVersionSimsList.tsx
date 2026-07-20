import { useEffect, useMemo } from "react";
import { useListAllSimsQuery } from "@/redux/api/sims-api";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "../ui/item";

type FlowVersionSimsListProps = {
  flowVersionId: string | null;
  onCreateNew: () => void;
  selectedSimId: string | null;
  onSelectSim: (simId: string) => void;
};

export function FlowVersionSimsList({
  flowVersionId,
  onCreateNew,
  selectedSimId,
  onSelectSim,
}: FlowVersionSimsListProps) {
  const { data, isLoading } = useListAllSimsQuery(
    flowVersionId ? { flowVersionId } : undefined,
  );

  const sims = useMemo(
    () =>
      data?.ok
        ? [...data.value].sort(
            (a, b) =>
              new Date(b.sim.createdAt).getTime() -
              new Date(a.sim.createdAt).getTime(),
          )
        : [],
    [data],
  );

  useEffect(() => {
    if (!selectedSimId && sims.length > 0) {
      onSelectSim(sims[0].sim.id);
    }
  }, [selectedSimId, sims, onSelectSim]);

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      <Button
        type="button"
        variant="outline"
        className="cursor-pointer  bg-sky-300 hover:bg-sky-200 dark:bg-sky-800 dark:hover:bg-sky-600"
        onClick={onCreateNew}
      >
        New
      </Button>

      {isLoading ? (
        <div className="p-4 text-muted-foreground">Loading sims...</div>
      ) : sims.length === 0 ? (
        <div className="p-4 text-muted-foreground">No sims yet.</div>
      ) : (
        sims.map(({ sim }) => (
          <button
            key={sim.id}
            type="button"
            onClick={() => onSelectSim(sim.id)}
            className={cn(
              "text-left cursor-pointer",
              sim.id === selectedSimId && "ring-2 ring-sky-500 rounded-md",
            )}
          >
            <Item variant="muted">
              <ItemContent>
                <ItemTitle className="text-xs">{sim.name}</ItemTitle>
                <ItemDescription className="line-clamp-1">
                  {sim.description ?? "no description"}
                </ItemDescription>
                <ItemDescription className="line-clamp-1">
                  {new Date(sim.createdAt).toLocaleString()}
                </ItemDescription>
              </ItemContent>
            </Item>
          </button>
        ))
      )}
    </div>
  );
}
