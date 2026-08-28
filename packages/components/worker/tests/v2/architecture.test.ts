import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const V2_SRC_DIR = join(import.meta.dirname, "..", "..", "src", "v2");
const BANNED_IDENTIFIERS = [
  "EventBusPort",
  "QueuePort",
  "EmitterFactoryPort",
  "AnyEvent",
];
// adapters/ is where legacy-compatibility code deliberately lives -- it's
// the one part of v2/ meant to know about the old queue/bus/event-envelope
// world (see legacy-httpjson-queue-consumer.adapter.ts). The ban applies to
// core: worker.ts, ports/, protocol/, concurrency/, and friends.
const EXCLUDED_DIRS = ["adapters"];

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.includes(entry)) continue;
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...listTsFiles(fullPath));
    } else if (entry.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Worker V2 core dependency boundary", () => {
  it("no core file under src/v2 (excluding adapters/) imports EventBusPort, QueuePort, EmitterFactoryPort, or AnyEvent", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(V2_SRC_DIR)) {
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
