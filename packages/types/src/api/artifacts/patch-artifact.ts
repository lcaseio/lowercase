import type { ArtifactMetadata } from "../../artifacts/artifact-metadata.js";
import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { Result } from "../../result.type.js";

export type PatchArtifactReq = ArtifactMetadata;

export type PatchArtifactRes = Result<ArtifactIndex, string>;
