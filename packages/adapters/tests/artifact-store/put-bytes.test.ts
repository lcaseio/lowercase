import { describe, expect, it } from "vitest";
import { FsArtifactStore } from "../../src/artifact-store/fs-artifact-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach } from "vitest";
import { rm, stat } from "node:fs/promises";

const filePath = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.join(filePath, "test-files");

const testHash =
  "2fde28ecc973a1fe910c4000b9afade87085cedb17f3da379148ffc75a9339b8";
const testFileName =
  "28ecc973a1fe910c4000b9afade87085cedb17f3da379148ffc75a9339b8.json";

describe("FsArtifactStore getBytes()", () => {
  afterEach(async () => {
    await rm(testPath, { recursive: true, force: true });
  });
  it("creates a file at the correct path and name for a given hash", async () => {
    const store = new FsArtifactStore(testPath);
    const json = JSON.stringify({ hello: "world" });
    const bytes = new TextEncoder().encode(json);
    const result = await store.putBytes(testHash, bytes);

    const expectedPath = path.join(
      testPath,
      "artifacts",
      "2f",
      "de",
      testFileName
    );
    expect(result).toEqual({ ok: true, path: expectedPath });
  });
  it("does not write a file for a hash that already exists", async () => {
    const store = new FsArtifactStore(testPath);
    const json = JSON.stringify({ hello: "world" });
    const bytes = new TextEncoder().encode(json);
    const result = await store.putBytes(testHash, bytes);

    const expectedPath = path.join(
      testPath,
      "artifacts",
      "2f",
      "de",
      testFileName
    );
    expect(result).toEqual({ ok: true, path: expectedPath });

    if (!result.ok) return;
    const stat1 = await stat(result.path);
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });

    const result2 = await store.putBytes(testHash, bytes);
    expect(result2).toEqual({ ok: true, path: expectedPath });

    if (!result2.ok) return;
    const stat2 = await stat(result2.path);
    expect(stat2.mtimeMs).toBe(stat1.mtimeMs);
  });
});
