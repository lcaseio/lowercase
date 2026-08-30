import type { JsonValue } from "@lcase/types";

// Capability-module inbound port (see docs/component-architecture/research/
// capability-modules.md): fuses ArtifactStorePort + ArtifactRepositoryPort
// behind one owned write policy. One entry point for every content type --
// contentType (already required) drives how `content` gets encoded, so
// callers never touch JSON.stringify/TextEncoder themselves for the common
// cases, while pre-encoded Uint8Array always works as the escape hatch for
// anything else (binary, or a dynamically-computed contentType).
export interface ArtifactWriterPort {
  save(
    content: JsonValue,
    contentType: "application/json",
    metadata?: ArtifactMetadataInput,
  ): Promise<SaveArtifactResult>;

  save(
    content: string,
    contentType: `text/${string}`,
    metadata?: ArtifactMetadataInput,
  ): Promise<SaveArtifactResult>;

  save(
    content: Uint8Array,
    contentType: string,
    metadata?: ArtifactMetadataInput,
  ): Promise<SaveArtifactResult>;
}

export type ArtifactMetadataInput = {
  label?: string;
  filename?: string;
};

export type ArtifactContentError = {
  code: "STORE_PUT_FAILED" | "ENCODING_FAILED";
  message: string;
  cause?: string;
};

export type ArtifactMetadataError = {
  code: "METADATA_WRITE_FAILED";
  message: string;
  cause?: string;
};

export type SaveArtifactResult =
  | { status: "saved"; hash: string }
  // content is durable, metadata write failed -- hash is safe to retry
  // against (content-addressed, so re-saving the same bytes is a no-op)
  | { status: "content-only"; hash: string; error: ArtifactMetadataError }
  | { status: "failed"; error: ArtifactContentError };
