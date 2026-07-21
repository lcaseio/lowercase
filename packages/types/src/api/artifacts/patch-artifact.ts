import type { ArtifactAssociation } from "../../artifacts/artifact-association.js";
import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { Result } from "../../result.type.js";

export type PatchArtifactReq = ArtifactAssociation;

export type PatchArtifactRes = Result<ArtifactIndex, string>;
