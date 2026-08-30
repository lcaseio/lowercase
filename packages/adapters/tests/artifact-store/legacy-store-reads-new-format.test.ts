import { describe, expect, it, afterEach } from "vitest";
import { FsArtifactStore } from "../../src/artifact-store/fs-artifact-store.js";
import { LegacyFsArtifactStore } from "../../src/artifact-store/legacy-fs-artifact-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";

const filePath = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.join(filePath, "test-artifacts-legacy-new-shared");

const testHash =
  "2fde28ecc973a1fe910c4000b9afade87085cedb17f3da379148ffc75a9339b8";

// Regression test: during the legacy/new transition, both stores are wired
// to the same root directory (see runtime.ts). Content written by the new,
// extensionless-file store must still be findable by the legacy store's
// extension-probing reader -- this is exactly the gap that broke real
// multi-step flows (a later step reading an earlier step's output/export).
describe("LegacyFsArtifactStore reads content written by FsArtifactStore", () => {
  afterEach(async () => {
    await rm(testPath, { recursive: true, force: true });
  });

  it("finds and returns bytes for a hash the new store wrote, with no extension", async () => {
    const newStore = new FsArtifactStore(testPath);
    const legacyStore = new LegacyFsArtifactStore(testPath);

    const bytes = new TextEncoder().encode(JSON.stringify({ hello: "world" }));
    const putResult = await newStore.putBytes(
      testHash,
      bytes,
      "application/json",
    );
    expect(putResult.ok).toBe(true);

    const legacyBytes = await legacyStore.getBytes(testHash);
    expect(legacyBytes).not.toBeNull();
    expect(new TextDecoder().decode(legacyBytes ?? undefined)).toBe(
      JSON.stringify({ hello: "world" }),
    );
  });

  it("still prefers an extensioned legacy file over the bare path when both exist", async () => {
    const newStore = new FsArtifactStore(testPath);
    const legacyStore = new LegacyFsArtifactStore(testPath);

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

    const legacyBytes = await legacyStore.getBytes(testHash);
    expect(new TextDecoder().decode(legacyBytes ?? undefined)).toBe(
      "legacy content",
    );
  });
});
