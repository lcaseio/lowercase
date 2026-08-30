import type {
  ArtifactStorePort,
  ArtifactStoreGetResult,
  ArtifactStorePutResult,
} from "@lcase/ports";

// A genuine in-memory ArtifactStorePort -- implements the real interface
// rather than casting a partial object, matching this codebase's newer
// no-`as unknown as X` bar (see
// packages/components/worker/tests/helpers/fake-artifacts.ts).
export function createFakeArtifactStorePort() {
  const data = new Map<string, { bytes: Uint8Array; contentType: string }>();

  const store: ArtifactStorePort = {
    putBytes(hash, bytes, contentType): Promise<ArtifactStorePutResult> {
      data.set(hash, { bytes, contentType });
      return Promise.resolve({ ok: true, path: `fake://${hash}` });
    },
    getBytes(hash): Promise<ArtifactStoreGetResult | null> {
      const entry = data.get(hash);
      return Promise.resolve(entry ? { ...entry } : null);
    },
  };

  return { store, data };
}
