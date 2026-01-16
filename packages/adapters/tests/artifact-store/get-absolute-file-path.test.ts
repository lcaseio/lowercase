import { describe, expect, it } from "vitest";
import { FsArtifactStore } from "../../src/artifact-store/fs-artifact-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testPath = path.dirname(fileURLToPath(import.meta.url));

describe("FsArtifactStore getAbsoluteFilePath()", () => {
  it("generates a valid absolute path for non tmp files", () => {
    const testHash = "1234567890";
    const store = new FsArtifactStore(testPath);
    const absoluteFilePath = store.getAbsoluteFilePath(testHash);
    const expectedPath = path.join(
      testPath,
      "artifacts",
      "12",
      "34",
      "567890.json"
    );

    expect(absoluteFilePath).toBe(expectedPath);
  });
  it("generates a valid absolute path for tmp files", () => {
    const testHash = "1234567890";
    const store = new FsArtifactStore(testPath);
    const absoluteFilePath = store.getAbsoluteFilePath(testHash, true);
    const expectedPath = path.join(
      testPath,
      "artifacts",
      "12",
      "34",
      "567890.json.tmp"
    );

    expect(absoluteFilePath).toBe(expectedPath);
  });
});
