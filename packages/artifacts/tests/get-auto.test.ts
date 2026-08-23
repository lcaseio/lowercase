import { describe, expect, it, vi } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import type { ArtifactRepositoryPort, ArtifactStorePort } from "@lcase/ports";
import type { ArtifactIndex } from "@lcase/types";

describe("Artifacts getAuto()", () => {
  it("uses the repository (not the legacy indexStore) to infer format, then fetches accordingly", async () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ a: 1 }));
    const store = {
      getBytes: vi.fn().mockResolvedValue(bytes),
    } as unknown as ArtifactStorePort;
    const getArtifact = vi.fn().mockResolvedValue({
      hash: "abc",
      time: "2026-01-01T00:00:00.000Z",
      format: "json",
      curated: false,
    } satisfies ArtifactIndex);
    const repository = { getArtifact } as unknown as ArtifactRepositoryPort;

    const artifacts = new Artifacts(store, repository);
    const result = await artifacts.getAuto("abc");

    expect(getArtifact).toHaveBeenCalledWith("abc");
    expect(result).toEqual({ ok: true, format: "json", value: { a: 1 } });
  });

  it("falls back to bytes when no repository is configured", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const store = {
      getBytes: vi.fn().mockResolvedValue(bytes),
    } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    const result = await artifacts.getAuto("abc");

    expect(result).toEqual({ ok: true, format: "bytes", value: bytes });
  });
});
