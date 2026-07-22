import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { Result } from "../../result.type.js";

export type GetCuratedArtifactsRes = Result<ArtifactIndex[], string>;

export type PostCurateArtifactReq = {
  artifactHash: string;
  crossVersion?: boolean;
};

export type PostCurateArtifactRes = Result<ArtifactIndex, string>;

export type DeleteCurateArtifactRes = Result<void, string>;
