export type ArtifactStorePutResult =
  | { ok: true; path: string }
  | { ok: false; cause: string };

export type ArtifactStorePort = {
  putBytes(hash: string, bytes: Uint8Array): Promise<ArtifactStorePutResult>;
  getBytes(hash: string): Promise<Uint8Array | null>;
};
