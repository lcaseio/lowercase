import { describe, it, expect, vi } from "vitest";
import { FsFlowIndexStore } from "../../src/flow-index-store/flow-index-store.js";
import type { FlowIndex, RunIndex } from "@lcase/types";
import path from "node:path";
import fs from "node:fs";
describe("FsFlowIndexStore", () => {
  it("putFlowIndex() writes the correct index to the correct path", async () => {
    const dirPath = import.meta.dirname;
    const hash = "test-hash";
    const store = new FsFlowIndexStore(dirPath);
    const index: FlowIndex = {
      hash,
      name: "test-name",
      version: "test-version",
      description: "test-description",
    };
    await store.putFlowIndex(index);
    const expectedFilePath = path.join(dirPath, `${hash}.index.json`);
    const data = fs.readFileSync(expectedFilePath, {
      encoding: "utf8",
    });
    fs.unlinkSync(expectedFilePath);
    const json = await JSON.parse(data);
    expect(json).toEqual(index);
  });
  it("getFlowIndex() reads the expected index", async () => {
    const dirPath = path.resolve(
      import.meta.dirname,
      "../fixtures/flow-index-store",
    );
    const hash = "test-hash";

    const store = new FsFlowIndexStore(dirPath);
    const result = await store.getFlowIndex(hash);
    const expectedIndex: FlowIndex = {
      hash,
      name: "test-name",
      version: "test-version",
      description: "test-description",
    };

    expect(result).toEqual({ ok: true, value: expectedIndex });
  });
});
