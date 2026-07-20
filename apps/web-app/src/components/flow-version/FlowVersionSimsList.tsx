import { useListAllSimsQuery } from "@/redux/api/sims-api";
import { Button } from "../ui/button";
import { Item, ItemContent, ItemDescription, ItemTitle } from "../ui/item";

type FlowVersionSimsListProps = {
  flowVersionId: string | null;
  onCreateNew: () => void;
};

export function FlowVersionSimsList({
  flowVersionId,
  onCreateNew,
}: FlowVersionSimsListProps) {
  const { data, isLoading } = useListAllSimsQuery(
    flowVersionId ? { flowVersionId } : undefined,
  );

  const sims = data?.ok
    ? [...data.value].sort(
        (a, b) =>
          new Date(b.sim.createdAt).getTime() -
          new Date(a.sim.createdAt).getTime(),
      )
    : [];

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
          <Item key={sim.id} variant="muted">
            <ItemContent>
              <ItemTitle className="text-xs">{sim.name}</ItemTitle>
              <ItemDescription>
                {sim.description ?? "no description"}
                {" - "}
                {new Date(sim.createdAt).toLocaleString()}
              </ItemDescription>
            </ItemContent>
          </Item>
        ))
      )}
    </div>
  );
}
