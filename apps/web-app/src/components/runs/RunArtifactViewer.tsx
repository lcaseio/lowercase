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
  if (artifact.data.format === "bytes") {
    return <div>Binary artifact preview is not supported.</div>;
  }
  return (
    <div>
      <p>Hash: {hash}</p>
      <p className="mb-2">Format: {artifact.data.format}</p>
      <pre className="text-sm/4.5 whitespace-pre-wrap wrap-break-word bg-gray-100 dark:bg-neutral-800 rounded-md p-5">
        {artifact.data.format === "json"
          ? JSON.stringify(artifact.data.value, null, 2)
          : artifact.data.value}
      </pre>
    </div>
  );
}
