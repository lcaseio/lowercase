import { describe, expect, it, vi } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import type {
  ArtifactRepositoryPort,
  ArtifactStorePort,
  ArtifactStorePutResult,
} from "@lcase/ports";
import type { ArtifactIndex } from "@lcase/types";
import { createHash } from "crypto";

function mockStore() {
  const mockResult: ArtifactStorePutResult = { ok: true, path: "test/path" };
  return {
    putBytes: vi.fn().mockResolvedValue(mockResult),
    getBytes: vi.fn(),
  } as unknown as ArtifactStorePort;
}

function mockRepository(returnedIndex: Partial<ArtifactIndex> = {}) {
  return {
    writeArtifact: vi.fn().mockResolvedValue({
      ok: true,
      value: { hash: "", time: "", curated: false, ...returnedIndex },
    }),
  } as unknown as ArtifactRepositoryPort;
}

describe("Artifacts write()", () => {
  it("hashes and stores content-only (metadata omitted), same as put()", async () => {
    const data = { b: 2, a: 1 };
    const bytes = new TextEncoder().encode(JSON.stringify({ a: 1, b: 2 }));
    const hash = createHash("sha256").update(bytes).digest("hex");

    const store = mockStore();
    const repository = mockRepository();
    const artifacts = new Artifacts(store, repository);

    const result = await artifacts.write({ format: "json", value: data });

    expect(result).toEqual({ ok: true, value: hash });
    expect(store.putBytes).toHaveBeenCalledWith(hash, bytes, ".json");
    expect(repository.writeArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ hash, format: "json" }),
      undefined,
    );
  });

  it("passes real ArtifactWriteMetadata straight through, unlike put()", async () => {
    const store = mockStore();
    const repository = mockRepository();
    const artifacts = new Artifacts(store, repository);

    await artifacts.write(
      { format: "text", value: "hello" },
      { curated: true, flowVersionId: "fv-1", paramCurations: ["input"] },
    );

    expect(repository.writeArtifact).toHaveBeenCalledWith(
      expect.objectContaining({ format: "text" }),
      { curated: true, flowVersionId: "fv-1", paramCurations: ["input"] },
    );
  });

  it("returns ok with just the hash when no repository is configured", async () => {
    const store = mockStore();
    const artifacts = new Artifacts(store);

    const result = await artifacts.write({ format: "text", value: "hello" });

    expect(result.ok).toBe(true);
  });

  it("surfaces a repository failure as INDEX_PUT_FAILED", async () => {
    const store = mockStore();
    const repository = {
      writeArtifact: vi
        .fn()
        .mockResolvedValue({ ok: false, error: "db exploded" }),
    } as unknown as ArtifactRepositoryPort;
    const artifacts = new Artifacts(store, repository);

    const result = await artifacts.write({ format: "text", value: "hello" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INDEX_PUT_FAILED");
  });
});
