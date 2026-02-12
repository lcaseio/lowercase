import { useListAllRunsQuery } from "@/redux/api/runs-api";
import { RunListItem } from "./RunListItem";

export function RunList() {
  const { data } = useListAllRunsQuery();

  if (data === undefined || data.ok === false) return <p>No runs</p>;

  return (
    <div>
      {data.runList
        .map((d) => d)
        .sort(
          (a, b) =>
            new Date(b.endTime as string).getTime() -
            new Date(a.endTime as string).getTime(),
        )
        .map((run) => (
          <RunListItem key={run.runId} runListItem={run} />
        ))}
    </div>
  );
}
