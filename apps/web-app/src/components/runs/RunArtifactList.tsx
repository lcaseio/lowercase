import { useGetRunDetailQuery } from "@/redux/api/runs-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { RunArtifactListItem } from "./RunArtifactListItem";

export function RunArtifactList({ runId }: { runId: string | null }) {
  const { data } = useGetRunDetailQuery(runId ? { runId } : skipToken);

  if (!data) return <div>No artifacts found yet</div>;
  if (!data.ok) return <div>Error getting run detail: {data.error}</div>;

  return (
    <div>
      {data.value.run.flowDefHash ? (
        <RunArtifactListItem
          item="Flow Definition Hash"
          hash={data.value.run.flowDefHash}
        />
      ) : null}
      {data.value.steps.map((step) => {
        if (!step.outputHash) return null;
        return (
          <RunArtifactListItem
            item={"Step: " + step.stepId}
            hash={step.outputHash}
            key={`${step.stepId}:${step.outputHash}`}
          />
        );
      })}
    </div>
  );
}
