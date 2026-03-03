import { useGetRunIndexQuery } from "@/redux/api/runs-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { RunArtifactListItem } from "./RunArtifactListItem";

export function RunArtifactList({ runId }: { runId: string | null }) {
  const { data } = useGetRunIndexQuery(runId ? { runId } : skipToken);

  if (!data) return <div>No artifacts found yet</div>;
  if (!data?.ok) return <div>Error getting run index: {data.error}</div>;

  return (
    <div>
      {data.index.flowDefHash ? (
        <RunArtifactListItem
          item="Flow Definition Hash"
          hash={data.index.flowDefHash}
        />
      ) : null}
      {Object.entries(data.index.steps).map(([stepName, details]) => {
        if (!details.outputHash) return null;
        return (
          <RunArtifactListItem
            item={"Step: " + stepName}
            hash={details.outputHash}
            key={details.outputHash}
          />
        );
      })}
    </div>
  );
}
