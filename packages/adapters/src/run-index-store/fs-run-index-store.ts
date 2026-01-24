import type { RunIndexStorePort } from "@lcase/ports";
import type { RunIndex } from "@lcase/types";
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
  async getRunIndex(runId: string): Promise<RunIndex | undefined> {
    try {
      const fileName = `${runId}.index.json`;
      const absoluteFilePath = path.join(this.dir, fileName);
      const data = fs.readFileSync(absoluteFilePath, { encoding: "utf8" });
      return await JSON.parse(data);
    } catch (e) {
      console.log(`Error reading index for run:${runId}. ${e}`);
    }
  }
}
