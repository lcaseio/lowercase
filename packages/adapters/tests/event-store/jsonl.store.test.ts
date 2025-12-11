import { describe, it, expect, vi, afterAll } from "vitest";
import { JsonlEventLog } from "../../src/event-store/jsonl.store.js";
import path from "path";
import { WriteStream } from "fs";
import fs from "fs";
import { AnyEvent } from "@lcase/types";

const testRunId = "test-runid";
const relativePath = "./jsonl";
const absoluteDirPath = path.join(import.meta.dirname, relativePath);
const absoluteFilePath = path.join(
  import.meta.dirname,
  relativePath,
  testRunId + ".events.jsonl"
);
console.log(absoluteDirPath);
console.log(absoluteFilePath);
const deleteFile = (path: string) => {
  if (fs.existsSync(path)) fs.unlinkSync(path);
};
describe("jsonl store adapter", () => {
  afterAll(async () => {});
  it("produces the expected output file path", () => {
    const store = new JsonlEventLog(absoluteDirPath);
    const filePath = store.getFilePath("12345-abc");

    const expectedPath = path.join(absoluteDirPath, "12345-abc.events.jsonl");
    expect(filePath).toBe(expectedPath);
  });

  it("getWriteStream() returns a write stream", () => {
    const store = new JsonlEventLog(absoluteDirPath);
    const stream = store.getWriteStream("12345");
    const fullPath = store.getFilePath("12345");
    expect(stream).toBeInstanceOf(WriteStream);
    stream.end();
    stream.on("finish", () => deleteFile(fullPath));
  });

  it("recordEvent() stores a jsonl event", async () => {
    const store = new JsonlEventLog(absoluteDirPath);
    const fakeEvent = {
      runid: testRunId,
    } as unknown as AnyEvent;
    const ok = await store.recordEvent(fakeEvent);
    const stream = store.getWriteStream(testRunId);
    stream.end();
    stream.on("finish", () => {
      const fileContents = fs.readFileSync(absoluteFilePath, {
        encoding: "utf8",
      });
      expect(fileContents).toBe(JSON.stringify(fakeEvent) + "\n");
      expect(JSON.parse(fileContents.trim())).toEqual(fakeEvent);
      deleteFile(absoluteFilePath);
    });
    expect(ok).toBe(true);
  });
});
