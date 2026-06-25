import { useGetArtifactQuery } from "@/redux/api/artifacts-api";
import { skipToken } from "@reduxjs/toolkit/query";

type Props = {
  hash: string | null;
};

export function ArtifactViewer({ hash }: Props) {
  const artifact = useGetArtifactQuery(hash ? { hash } : skipToken);

  if (!hash) return <div>Select an artifact to view it</div>;
  if (artifact.isLoading) return <div>Loading artifact...</div>;
  if (!artifact.data) return <div>No artifact data</div>;
  if (!artifact.data.ok)
    return <div>Error getting artifact: {artifact.data.error}</div>;

  if (artifact.data.format === "bytes") {
    return (
      <div>
        <p className="font-semibold">Binary artifact</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Byte length: {artifact.data.byteLength}
        </p>
        <p className="text-sm mt-2">
          Binary artifact preview is not supported.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2">
        <span className="font-semibold">Hash:</span> {hash}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Format: </span>
        {artifact.data.format}
      </p>
      <pre className="text-sm whitespace-pre-wrap break-words rounded-md bg-slate-100 p-4 dark:bg-neutral-800">
        {artifact.data.format === "json"
          ? JSON.stringify(artifact.data.value, null, 2)
          : artifact.data.value}
      </pre>
    </div>
  );
}
