import type { RunIndex, RunIndexStorePort } from "@lcase/ports";
import fs from "node:fs";
import path from "node:path";

export class FsRunIndexStore implements RunIndexStorePort {
  constructor(public dir: string) {
    if (!path.isAbsolute(dir) || path.extname(dir) !== "") {
      throw new Error(
        `[fs-run-index-store] path must point to an absolute directory: ${dir}`,
      );
    }
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  async putRunIndex(index: RunIndex, runId: string): Promise<void> {
    try {
      const json = JSON.stringify(index, null, 2);
      const fileName = `${runId}.index.json`;
      const fullPath = path.join(this.dir, fileName);
      fs.writeFileSync(fullPath, json, { encoding: "utf8" });
    } catch (e) {
      console.log("Error writing run index", e);
    }
    return;
  }
  getRunIndex(runId: string): Promise<RunIndex | undefined> {
    throw new Error("Method not implemented.");
  }
}
