// The pre-content-type CAS store port: putBytes keys files by a caller-given
// file extension, getBytes has no way to know what it's reading back and
// probes a closed set of extensions (see LegacyFsArtifactStore). Kept only
// for the old Artifacts/ArtifactsPort call path -- new code should depend on
// ArtifactStorePort instead, which carries content-type as first-class data.
export type LegacyArtifactStorePutResult =
  { ok: true; path: string } | { ok: false; cause: string };

export type LegacyArtifactStorePort = {
  putBytes(
    hash: string,
    bytes: Uint8Array,
    extension: string,
  ): Promise<LegacyArtifactStorePutResult>;
  getBytes(hash: string): Promise<Uint8Array | null>;
};
