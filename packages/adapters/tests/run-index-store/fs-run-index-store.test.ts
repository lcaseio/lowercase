import { describe, it, expect, vi } from "vitest";
import { FsRunIndexStore } from "../../src/run-index-store/fs-run-index-store.js";
import type { RunIndex } from "@lcase/types";
import path from "node:path";
import fs from "node:fs";
describe("FsRunIndexStore", () => {
  it("putRunIndex() writes the correct index to the correct path", async () => {
    const dirPath = import.meta.dirname;
    const runId = "run-242b4e22-d5aa-44fc-bec2-f745eb96f605";
    const store = new FsRunIndexStore(dirPath);
    const index: RunIndex = {
      flowId: "933dcae021a90ab5df5a5b1b47b590bd",
      steps: {
        post: {
          startTime: "2026-01-23T00:01:08.629Z",
          status: "failure",
          endTime: "2026-01-23T00:01:38.869Z",
          outputHash:
            "9bee09271b3d182c20418cdef8f094d26eb8b294e502bcf7f549a1f92e80f097",
          duration: 30.24,
        },
        delete: {
          startTime: "2026-01-23T00:01:38.871Z",
          status: "success",
          endTime: "2026-01-23T00:01:38.984Z",
          outputHash:
            "b128acd98f5fed701c40542d560d85aba2b647fba73bcb0276978dc9289d9b72",
          duration: 0.113,
        },
      },
      traceId: "4fc3c54820165b67c8f724f9e3a928bc",
      startTime: "2026-01-23T00:01:08.628Z",
      endTime: "2026-01-23T00:01:38.984Z",
      duration: 30.356,
    };
    await store.putRunIndex(index, runId);
    const expectedFilePath = path.join(dirPath, `${runId}.index.json`);
    const data = fs.readFileSync(expectedFilePath, {
      encoding: "utf8",
    });
    fs.unlinkSync(expectedFilePath);
    const json = await JSON.parse(data);
    expect(json).toEqual(index);
  });
  it("getRunIndex() reads the expected index", async () => {
    const dirPath = path.resolve(
      import.meta.dirname,
      "../fixtures/run-index-store",
    );
    const runId = "run-242b4e22-d5aa-44fc-bec2-f745eb96f605";
    const store = new FsRunIndexStore(dirPath);
    const index = await store.getRunIndex(runId);
    const expectedIndex: RunIndex = {
      flowId: "933dcae021a90ab5df5a5b1b47b590bd",
      steps: {
        post: {
          startTime: "2026-01-23T00:01:08.629Z",
          status: "failure",
          endTime: "2026-01-23T00:01:38.869Z",
          outputHash:
            "9bee09271b3d182c20418cdef8f094d26eb8b294e502bcf7f549a1f92e80f097",
          duration: 30.24,
        },
        delete: {
          startTime: "2026-01-23T00:01:38.871Z",
          status: "success",
          endTime: "2026-01-23T00:01:38.984Z",
          outputHash:
            "b128acd98f5fed701c40542d560d85aba2b647fba73bcb0276978dc9289d9b72",
          duration: 0.113,
        },
      },
      traceId: "4fc3c54820165b67c8f724f9e3a928bc",
      startTime: "2026-01-23T00:01:08.628Z",
      endTime: "2026-01-23T00:01:38.984Z",
      duration: 30.356,
    };

    expect(index).toEqual(expectedIndex);
  });
});
