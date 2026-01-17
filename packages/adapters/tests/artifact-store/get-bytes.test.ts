import { describe, expect, it } from "vitest";
import { FsArtifactStore } from "../../src/artifact-store/fs-artifact-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filePath = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.resolve(filePath, "../fixtures");
const testHash =
  "b9cd2605ea75293b16b892a97c5e4b0bc18f3dafd0cbdf897c80258d57415c80";
describe("FsArtifactStore getBytes()", () => {
  it("opens the a file for a hash that exists", async () => {
    const store = new FsArtifactStore(testPath);
    const bytes = await store.getBytes(testHash);

    expect(bytes).not.toBe(null);
  });
  it("returns null for a path that doesn't exist", async () => {
    const store = new FsArtifactStore(testPath);
    const bytes = await store.getBytes("1234567890");

    expect(bytes).toBe(null);
  });
});
