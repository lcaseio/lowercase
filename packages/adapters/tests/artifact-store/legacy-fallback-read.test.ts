import { describe, expect, it, afterEach } from "vitest";
import { FsArtifactStore } from "../../src/artifact-store/fs-artifact-store.js";
import { LegacyFsArtifactStore } from "../../src/artifact-store/legacy-fs-artifact-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";

const filePath = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.join(filePath, "test-artifacts-legacy-fallback-read");

const testHash =
  "3fde28ecc973a1fe910c4000b9afade87085cedb17f3da379148ffc75a9339b8";

// Regression test, reverse direction of legacy-store-reads-new-format.test.ts:
// run params and flow defs are still written exclusively through
// LegacyFsArtifactStore's extensioned files. FsArtifactStore must still find
// those, or worker's reads (now routed through it) would fail to resolve
// param references that were never written by the new writer.
describe("FsArtifactStore reads content written by LegacyFsArtifactStore", () => {
  afterEach(async () => {
    await rm(testPath, { recursive: true, force: true });
  });

  it("finds a legacy-extensioned file and derives contentType from its extension", async () => {
    const legacyStore = new LegacyFsArtifactStore(testPath);
    const newStore = new FsArtifactStore(testPath);

    await legacyStore.putBytes(
      testHash,
      new TextEncoder().encode("hello"),
      ".txt",
    );

    const result = await newStore.getBytes(testHash);

    expect(result).not.toBeNull();
    expect(result?.contentType).toBe("text/plain");
    expect(new TextDecoder().decode(result?.bytes)).toBe("hello");
  });

  it("still prefers the new sidecar-backed format over a legacy file when both exist", async () => {
    const legacyStore = new LegacyFsArtifactStore(testPath);
    const newStore = new FsArtifactStore(testPath);

    await legacyStore.putBytes(
      testHash,
      new TextEncoder().encode("legacy content"),
      ".txt",
    );
    await newStore.putBytes(
      testHash,
      new TextEncoder().encode("new content"),
      "text/plain",
    );

    const result = await newStore.getBytes(testHash);

    expect(new TextDecoder().decode(result?.bytes)).toBe("new content");
  });
});
