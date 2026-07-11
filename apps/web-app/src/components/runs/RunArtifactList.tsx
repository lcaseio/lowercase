import { useState } from "react";
import { useGetRunDetailQuery } from "@/redux/api/runs-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { RunArtifactListItem } from "./RunArtifactListItem";
import {
  EvaluateExportModal,
  type EvaluateExportTarget,
} from "../evals/EvaluateExportModal";

export function RunArtifactList({ runId }: { runId: string | null }) {
  const { data } = useGetRunDetailQuery(runId ? { runId } : skipToken);
  const [evaluateTarget, setEvaluateTarget] =
    useState<EvaluateExportTarget | null>(null);

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

      {data.value.steps.some((step) => step.exports && step.exports.length > 0) ? (
        <div className="mb-4">
          <h3 className="mb-2 font-semibold">Exports</h3>
          <div className="flex flex-col gap-2">
            {data.value.steps.flatMap((step) =>
              (step.exports ?? []).map((exp) => (
                <RunArtifactListItem
                  key={`${step.stepId}:${exp.name}:${exp.artifactHash}`}
                  item={buildExportLabel(step.stepId, exp.name, exp.artifact?.format)}
                  hash={exp.artifactHash}
                  onEvaluate={
                    runId
                      ? () =>
                          setEvaluateTarget({
                            runId,
                            stepId: step.stepId,
                            exportName: exp.name,
                          })
                      : undefined
                  }
                />
              )),
            )}
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

      {evaluateTarget ? (
        <EvaluateExportModal
          target={evaluateTarget}
          onClose={() => setEvaluateTarget(null)}
        />
      ) : null}
    </div>
  );
}

function buildParamLabel(name: string, format?: string): string {
  return format ? `Run Param: ${name} (${format})` : `Run Param: ${name}`;
}

function buildExportLabel(stepId: string, name: string, format?: string): string {
  const base = `Export: ${stepId}.${name}`;
  return format ? `${base} (${format})` : base;
}
