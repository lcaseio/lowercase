import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { Result } from "../../result.type.js";

export type GetCuratedArtifactsRes = Result<ArtifactIndex[], string>;
