import type { FlowIndexStorePort } from "@lcase/ports";
import type { FlowIndex, Result } from "@lcase/types";
import fs from "node:fs";
import path from "node:path";

export class FsFlowIndexStore implements FlowIndexStorePort {
  constructor(public dir: string) {
    if (!path.isAbsolute(dir) || path.extname(dir) !== "") {
      throw new Error(
        `[fs-flow-index-store] path must point to an absolute directory: ${dir}`,
      );
    }
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  async putFlowIndex(index: FlowIndex): Promise<Result<string, string>> {
    try {
      const json = JSON.stringify(index, null, 2);
      const fileName = `${index.hash}.index.json`;
      const fullPath = path.join(this.dir, fileName);
      fs.writeFileSync(fullPath, json, { encoding: "utf8" });
      return { ok: true, value: fullPath };
    } catch (e) {
      return { ok: false, error: `Error writing run index: ${e}` };
    }
  }
  async getFlowIndex(hash: string): Promise<Result<FlowIndex, string>> {
    try {
      const fileName = `${hash}.index.json`;
      const absoluteFilePath = path.join(this.dir, fileName);
      const data = fs.readFileSync(absoluteFilePath, { encoding: "utf8" });
      const json = await JSON.parse(data);
      return { ok: true, value: json as FlowIndex };
    } catch (e) {
      return { ok: false, error: `Error reading index: ${e}` };
    }
  }
  async getAllFlowIndexes(): Promise<Result<FlowIndex[], string>> {
    const indexes: FlowIndex[] = [];

    try {
      const files = fs
        .readdirSync(this.dir)
        .filter((contents) => contents.endsWith(".index.json"));

      for (const file of files) {
        const absoluteFilePath = path.join(this.dir, file);
        const data = fs.readFileSync(absoluteFilePath, { encoding: "utf8" });
        const json = await JSON.parse(data);
        indexes.push(json as FlowIndex);
      }
      indexes.sort((a, b) =>
        a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1,
      );
      return { ok: true, value: indexes };
    } catch (e) {
      return { ok: false, error: `Error getting all indexes: ${e}` };
    }
  }
}
