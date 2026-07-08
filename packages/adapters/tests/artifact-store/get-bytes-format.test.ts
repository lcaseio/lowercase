import { describe, expect, it } from "vitest";
import { FsArtifactStore } from "../../src/artifact-store/fs-artifact-store.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { afterEach } from "vitest";

const filePath = path.dirname(fileURLToPath(import.meta.url));
const testPath = path.join(filePath, "test-artifacts-formats");

describe("FsArtifactStore getBytes() format resolution", () => {
  afterEach(async () => {
    await rm(testPath, { recursive: true, force: true });
  });

  it("reads bytes from extension-specific artifact files by hash", async () => {
    const store = new FsArtifactStore(testPath);
    const hash =
      "2fde28ecc973a1fe910c4000b9afade87085cedb17f3da379148ffc75a9339b8";
    const absoluteFilePath = store.getAbsoluteFilePath(hash, ".md");

    await mkdir(path.dirname(absoluteFilePath), { recursive: true });
    await writeFile(absoluteFilePath, Buffer.from("# hello", "utf8"));

    const bytes = await store.getBytes(hash);
    expect(new TextDecoder().decode(bytes ?? undefined)).toBe("# hello");
  });
});
