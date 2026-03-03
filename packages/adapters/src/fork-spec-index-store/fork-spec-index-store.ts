import { ForkSpecIndexStorePort } from "@lcase/ports";
import type { ForkSpecIndex, Result } from "@lcase/types";
import fs from "node:fs/promises";
import path from "node:path";

export class FsForkSpecIndexStore implements ForkSpecIndexStorePort {
  constructor(public dir: string) {
    if (!path.isAbsolute(dir) || path.extname(dir) !== "") {
      throw new Error(
        `[fs-run-index-store] path must point to an absolute directory: ${dir}`,
      );
    }
  }

  async init() {
    try {
      await fs.access(this.dir);
    } catch (e) {
      try {
        await fs.mkdir(this.dir, { recursive: true });
        return;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Cannot create directory.";
        throw new Error(`[fs-flow-spec-index-store] ${message}`);
      }
    }
  }
  async put(index: ForkSpecIndex): Promise<Result<ForkSpecIndex, string>> {
    try {
      const json = JSON.stringify(index, null, 2);
      const fileName = `${index.forkSpecHash}.index.json`;
      const fullPath = path.join(this.dir, fileName);
      await fs.writeFile(fullPath, json, { encoding: "utf8" });
      return { ok: true, value: index };
    } catch (e) {
      return { ok: false, error: `"Error writing fork spec index ${e}` };
    }
  }
  async get(forkSpecIndexId: string): Promise<ForkSpecIndex | undefined> {
    try {
      const fileName = `${forkSpecIndexId}.index.json`;
      const absoluteFilePath = path.join(this.dir, fileName);
      const data = await fs.readFile(absoluteFilePath, { encoding: "utf8" });
      return await JSON.parse(data);
    } catch (e) {
      console.log(`Error reading index for fork spec:${forkSpecIndexId}. ${e}`);
    }
  }

  async getIndexList(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dir);

      const fileNames: string[] = [];
      if (!files || files.length === 0) return [];
      for (const file of files) {
        if (!file.endsWith(".index.json")) continue;
        fileNames.push(file.replace(".index.json", ""));
      }
      return fileNames;
    } catch (err) {
      console.log(`Error reading directory ${this.dir}: ${err}`);
      return [];
    }
  }

  async getAll(): Promise<ForkSpecIndex[]> {
    try {
      const forkSpecIndexes: ForkSpecIndex[] = [];
      const fileNames = await this.getIndexList();

      for (const fileName of fileNames) {
        const forkSpecIndex = await this.get(fileName);
        if (forkSpecIndex) forkSpecIndexes.push(forkSpecIndex);
      }
      return forkSpecIndexes;
    } catch (err) {
      console.log(`Error getting all files directory ${this.dir}: ${err}`);
      return [];
    }
  }
}
