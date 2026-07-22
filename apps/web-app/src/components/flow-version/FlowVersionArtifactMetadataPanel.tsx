import { skipToken } from "@reduxjs/toolkit/query";
import type { FlowParamDefinition } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { InputField } from "../fields/InputField";
import { SwitchField } from "../fields/SwitchField";
import { CuratedParamsField } from "../fields/CuratedParamsField";

type Props = {
  flowVersionId: string | null;
  selectedHash: string | null;
  params?: Record<string, FlowParamDefinition>;
};

function IdentityField({ label, value }: { label: string; value?: string }) {
  if (value === undefined) return null;
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
      <p className="text-sm font-mono break-all">{value}</p>
    </div>
  );
}

// right panel of Artifacts mode -- read-only metadata/associations for whatever's
// selected in the list. Reuses the list's own (cached) query rather than a
// second endpoint, since useListArtifactsQuery is already scoped+fetched there
// with identical args -- this is a cache hit, not a new network request.
export function FlowVersionArtifactMetadataPanel({
  flowVersionId,
  selectedHash,
  params,
}: Props) {
  const { data, isLoading } = useListArtifactsQuery(
    flowVersionId ? { flowVersionId, curated: "true" } : skipToken,
  );

  if (!selectedHash) {
    return <div className="p-4">Select an artifact to view its metadata</div>;
  }
  if (isLoading) {
    return <div className="p-4">Loading artifact metadata...</div>;
  }
  if (!data) {
    return <div className="p-4">No artifact data</div>;
  }
  if (!data.ok) {
    return <div className="p-4">Error loading artifacts: {data.error}</div>;
  }

  const item = data.value.find((i) => i.artifact.hash === selectedHash);
  if (!item) {
    return <div className="p-4">Artifact metadata not found</div>;
  }

  const { artifact, associations } = item;
  const curatedParamNames = associations.paramCurations.map(
    (pc) => pc.paramName,
  );
  // only offer params whose declared content type actually matches this
  // artifact -- same check run.service.ts already uses to validate a run's
  // param artifacts; curateArtifactForParam itself doesn't enforce this yet
  const compatibleParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, def]) =>
          isArtifactCompatible(artifact, def.type),
        ),
      )
    : undefined;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <IdentityField label="Hash" value={artifact.hash} />
      <IdentityField
        label="Time"
        value={new Date(artifact.time).toLocaleString()}
      />
      <IdentityField label="Content Type" value={artifact.contentType} />
      <IdentityField
        label="Size"
        value={
          artifact.size !== undefined ? `${artifact.size} bytes` : undefined
        }
      />
      <IdentityField label="Format" value={artifact.format} />

      <InputField label="Label" value={artifact.label} />
      <SwitchField label="Share" value={!!associations.flowId} />
      <CuratedParamsField
        label="Params"
        params={compatibleParams}
        curatedParamNames={curatedParamNames}
      />
    </div>
  );
}
