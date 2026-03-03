import { useGetArtifactQuery } from "@/redux/api/artifacts-api";
import { getRunsSelectedArtifactHash } from "@/redux/slices/runs-slice";
import { useAppSelector } from "@/redux/typed-hooks";
import { skipToken } from "@reduxjs/toolkit/query";

export function RunArtifactViewer() {
  const hash = useAppSelector(getRunsSelectedArtifactHash);
  const artifact = useGetArtifactQuery(hash ? { hash } : skipToken);
  if (!artifact.data) return <div>No artifact selected</div>;
  if (!artifact.data.ok)
    return <div> Error getting artifact: {artifact.data.error}</div>;
  return (
    <div>
      <pre>{JSON.stringify(artifact.data.jsonValue, null, 2)}</pre>
    </div>
  );
}
