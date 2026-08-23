import type { ArtifactIndex } from "../../artifacts/artifact-index.js";
import type { ArtifactUpdateMetadata } from "../../artifacts/artifact-update-metadata.js";
import type { Result } from "../../result.type.js";

// authored (application/json) branch only -- file uploads go through
// multipart instead, so `value` never needs to represent raw bytes here.
// Always a raw string, even when contentType implies json -- matches the
// multipart branch's own contract (raw text in, server decides format and
// parses), and keeps `value` unambiguous: a JsonValue | string type here
// couldn't distinguish "the artifact's real content is the string 'x'" from
// "a caller forgot to JSON.parse before sending", since both look identical
// on the wire.
export type PostArtifactReq = {
  contentType: string;
  value: string;
  metadata?: ArtifactUpdateMetadata;
};

export type PostArtifactRes = Result<ArtifactIndex, string>;
