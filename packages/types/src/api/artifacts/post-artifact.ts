import type { JsonValue } from "../../json-value.js";
import type { ArtifactUpdateMetadata } from "../../artifacts/artifact-update-metadata.js";
import type { Result } from "../../result.type.js";

// authored (application/json) branch only -- file uploads go through
// multipart instead, so `value` never needs to represent raw bytes here
export type PostArtifactReq = {
  contentType: string;
  value: JsonValue | string;
  metadata?: ArtifactUpdateMetadata;
};

export type PostArtifactRes = Result<string, string>;
