import type { ArtifactUpdateMetadata } from "../../artifacts/artifact-update-metadata.js";
import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { Result } from "../../result.type.js";

export type PatchArtifactReq = ArtifactUpdateMetadata;

export type PatchArtifactRes = Result<ArtifactIndex, string>;
