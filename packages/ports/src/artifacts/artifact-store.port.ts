// Content-type travels with the blob itself, as first-class data -- mirrors
// what an S3/MinIO-style object store gives for free via native object
// metadata (Content-Type on PutObject/HeadObject). Replaces the old
// extension-keyed, probe-on-read shape (see LegacyArtifactStorePort).
export type ArtifactStorePutResult =
  { ok: true; path: string } | { ok: false; cause: string };

export type ArtifactStoreGetResult = {
  bytes: Uint8Array;
  contentType: string;
};

export type ArtifactStorePort = {
  putBytes(
    hash: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<ArtifactStorePutResult>;
  getBytes(hash: string): Promise<ArtifactStoreGetResult | null>;
};
