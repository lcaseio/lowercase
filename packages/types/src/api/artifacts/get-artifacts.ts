import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { Result } from "../../result.type.js";

// querystring values arrive as raw strings -- "curated" is parsed "true"/"false" by the route
export type GetArtifactsReq = {
  flowId?: string;
  flowVersionId?: string;
  curated?: string;
};

export type GetArtifactsRes = Result<ArtifactIndex[], string>;
