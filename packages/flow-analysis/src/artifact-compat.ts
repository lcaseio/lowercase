import type { ArtifactIndex, FlowParamContentType } from "@lcase/types";

export function isArtifactCompatible(
  artifact: ArtifactIndex,
  type: FlowParamContentType,
): boolean {
  if (artifact.contentType === type) return true;

  switch (type) {
    case "application/json":
      return artifact.format === "json";
    case "text/plain":
      return artifact.format === "text";
    case "text/markdown":
      return artifact.format === "markdown";
  }
}
