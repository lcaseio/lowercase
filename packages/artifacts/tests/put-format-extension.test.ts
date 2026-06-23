import { describe, expect, it, vi } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import { ArtifactStorePort, ArtifactStorePutResult } from "@lcase/ports";

describe("Artifacts format-specific extensions", () => {
  it("writes text artifacts with .txt", async () => {
    const mockResult: ArtifactStorePutResult = { ok: true, path: "test/path" };
    const putBytes = vi.fn().mockResolvedValue(mockResult);
    const store = { putBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    await artifacts.putText("hello");

    const [hash, bytes, extension] = putBytes.mock.calls[0];
    expect(typeof hash).toBe("string");
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(extension).toBe(".txt");
  });

  it("writes markdown artifacts with .md", async () => {
    const mockResult: ArtifactStorePutResult = { ok: true, path: "test/path" };
    const putBytes = vi.fn().mockResolvedValue(mockResult);
    const store = { putBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    await artifacts.putMarkdown("# hello");

    const [, , extension] = putBytes.mock.calls[0];
    expect(extension).toBe(".md");
  });

  it("writes byte artifacts with .bin", async () => {
    const mockResult: ArtifactStorePutResult = { ok: true, path: "test/path" };
    const putBytes = vi.fn().mockResolvedValue(mockResult);
    const store = { putBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    await artifacts.putBytes(new Uint8Array([1, 2, 3]));

    const [, , extension] = putBytes.mock.calls[0];
    expect(extension).toBe(".bin");
  });
});
