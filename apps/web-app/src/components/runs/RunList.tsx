import { useListAllRunsQuery } from "@/redux/api/runs-api";
import { RunListItem } from "./RunListItem";
import { useAppDispatch } from "@/redux/typed-hooks";
import { setRunsSelectedArtifactHash } from "@/redux/slices/runs-slice";

export function RunList() {
  const { data } = useListAllRunsQuery();
  const dispatch = useAppDispatch();
  dispatch(setRunsSelectedArtifactHash(null));

  if (data === undefined || data.ok === false) return <p>No runs</p>;
  const runs = [...data.runList];

  return (
    <div className="xs:max-w-12/12 sm:max-w-12/12 lg:max-w-8/12 flex flex-col gap-6 mt-4">
      {runs
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
