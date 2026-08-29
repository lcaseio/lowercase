import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WORKER_SRC_DIR = join(import.meta.dirname, "..", "src");
const BANNED_IDENTIFIERS = [
  "EventBusPort",
  "QueuePort",
  "EmitterFactoryPort",
  "AnyEvent",
];

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...listTsFiles(fullPath));
    } else if (entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("worker core dependency boundary", () => {
  it("no worker source file imports EventBusPort, QueuePort, EmitterFactoryPort, or AnyEvent", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(WORKER_SRC_DIR)) {
      const contents = readFileSync(file, "utf8");
      // Import lines only, not the full file text -- a doc comment is
      // allowed to *mention* AnyEvent (e.g. to explain a deliberate
      // divergence from it) without that counting as a real dependency.
      const importLines = contents
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line));
      for (const identifier of BANNED_IDENTIFIERS) {
        if (importLines.some((line) => line.includes(identifier))) {
          offenders.push(`${file}: ${identifier}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
