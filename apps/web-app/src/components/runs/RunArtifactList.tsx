import { useGetRunDetailQuery } from "@/redux/api/runs-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { RunArtifactListItem } from "./RunArtifactListItem";

export function RunArtifactList({ runId }: { runId: string | null }) {
  const { data } = useGetRunDetailQuery(runId ? { runId } : skipToken);

  if (!data) return <div>No artifacts found yet</div>;
  if (!data.ok) return <div>Error getting run detail: {data.error}</div>;

  return (
    <div>
      {data.value.params && data.value.params.length > 0 ? (
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">Run Params</h3>
          <div className="flex flex-col gap-2">
            {data.value.params.map((param) => (
              <RunArtifactListItem
                key={`${param.name}:${param.artifactHash}`}
                item={buildParamLabel(param.name, param.artifact?.format)}
                hash={param.artifactHash}
              />
            ))}
          </div>
        </div>
      ) : null}

      <h3 className="mb-2 font-semibold">Artifacts</h3>
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

function buildParamLabel(name: string, format?: string): string {
  return format ? `Run Param: ${name} (${format})` : `Run Param: ${name}`;
}
