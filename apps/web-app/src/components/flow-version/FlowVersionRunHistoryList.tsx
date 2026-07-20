import { useListAllRunsQuery } from "@/redux/api/runs-api";
import { cn } from "@/lib/utils";
import { Item, ItemContent, ItemDescription, ItemTitle } from "../ui/item";

type FlowVersionRunHistoryListProps = {
  flowVersionId: string | null;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
};

export function FlowVersionRunHistoryList({
  flowVersionId,
  selectedRunId,
  onSelectRun,
}: FlowVersionRunHistoryListProps) {
  const { data, isLoading } = useListAllRunsQuery(
    flowVersionId ? { flowVersionId } : undefined,
  );

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading runs...</div>;
  }

  if (!data?.ok || data.runList.length === 0) {
    return <div className="p-4 text-muted-foreground">No runs yet.</div>;
  }

  const runs = [...data.runList].sort(
    (a, b) =>
      new Date(b.endTime ?? b.startTime ?? 0).getTime() -
      new Date(a.endTime ?? a.startTime ?? 0).getTime(),
  );

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      {runs.map((run) => (
        <button
          key={run.runId}
          type="button"
          onClick={() => onSelectRun(run.runId)}
          className={cn(
            "text-left cursor-pointer",
            run.runId === selectedRunId && "ring-2 ring-sky-500 rounded-md",
          )}
        >
          <Item variant="muted">
            <ItemContent>
              <ItemTitle className="text-xs">{run.runId}</ItemTitle>
              <ItemDescription>
                {run.startTime
                  ? new Date(run.startTime).toLocaleString()
                  : "no start time"}
                {run.duration ? ` - ${run.duration}s` : ""}
              </ItemDescription>
            </ItemContent>
          </Item>
        </button>
      ))}
    </div>
  );
}
