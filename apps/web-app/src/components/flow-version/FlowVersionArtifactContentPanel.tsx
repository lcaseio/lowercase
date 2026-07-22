import { skipToken } from "@reduxjs/toolkit/query";
import { useGetArtifactQuery } from "@/redux/api/artifacts-api";
import { CodeEditor } from "@/components/CodeEditor";
import { artifactFormatToLanguage } from "@/lib/ref-resolution";

type FlowVersionArtifactContentPanelProps = {
  hash: string | null;
};

export function FlowVersionArtifactContentPanel({
  hash,
}: FlowVersionArtifactContentPanelProps) {
  const artifact = useGetArtifactQuery(hash ? { hash } : skipToken);

  if (!hash) {
    return <div className="p-4">Select an artifact to view it</div>;
  }
  if (artifact.isLoading) {
    return <div className="p-4">Loading artifact...</div>;
  }
  if (!artifact.data) {
    return <div className="p-4">No artifact data</div>;
  }
  if (!artifact.data.ok) {
    return (
      <div className="p-4">Error getting artifact: {artifact.data.error}</div>
    );
  }

  if (artifact.data.format === "bytes") {
    return (
      <div className="p-4">
        <p className="font-semibold">Binary artifact</p>
        <p className="text-sm text-muted-foreground">
          {artifact.data.byteLength} bytes. Preview not supported.
        </p>
      </div>
    );
  }

  const value =
    artifact.data.format === "json"
      ? JSON.stringify(artifact.data.value, null, 2)
      : artifact.data.value;

  return (
    <div className="h-full">
      <CodeEditor
        value={value}
        language={artifactFormatToLanguage(artifact.data.format)}
        readOnly
        height="100%"
      />
    </div>
  );
}
