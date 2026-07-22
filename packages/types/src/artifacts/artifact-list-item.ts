import type { ArtifactIndex } from "./artifact-index.js";

export type ArtifactListItem = {
  artifact: Omit<ArtifactIndex, "flowId" | "flowVersionId" | "curated">;
  associations: {
    flowId?: string;
    flowVersionId?: string;
    curated: boolean;
    paramCurations: { flowVersionId: string; paramName: string }[];
  };
};
