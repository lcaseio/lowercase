import type { Result } from "@lcase/types";
import fs from "node:fs/promises";
import path from "node:path";

export type FsJsonIndexStoreOptions<T> = {
  dir: string;
  extension?: string;
  encoding?: BufferEncoding;
  sort?: (a: T, b: T) => number;
};

export class FsJsonIndexStore<T> {
  private dir: string;
  private extension: string;
  private encoding: BufferEncoding;
  private sort?: (a: T, b: T) => number;

  constructor(options: FsJsonIndexStoreOptions<T>) {
    const { dir } = options;
    if (!path.isAbsolute(dir) || path.extname(dir) !== "") {
      throw new Error(
        `[fs-json-index-store] path must point to an absolute directory: ${dir}`,
      );
    }

    this.dir = dir;
    this.extension = options.extension ?? ".index.json";
    if (!this.extension.startsWith(".")) {
      this.extension = `.${this.extension}`;
    }
    this.encoding = options.encoding ?? "utf8";
    this.sort = options.sort;
  }

  async init(): Promise<void> {
    try {
      await fs.access(this.dir);
    } catch (e) {
      try {
        await fs.mkdir(this.dir, { recursive: true });
        return;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Cannot create directory.";
        throw new Error(`[fs-json-index-store] ${message}`);
      }
    }
  }

  async put(id: string, value: T): Promise<Result<string, string>> {
    try {
      const json = JSON.stringify(value, null, 2);
      const fullPath = path.join(this.dir, this.fileName(id));
      await fs.writeFile(fullPath, json, { encoding: this.encoding });
      return { ok: true, value: fullPath };
    } catch (e) {
      return { ok: false, error: `Error writing index: ${e}` };
    }
  }

  async get(id: string): Promise<T | undefined> {
    try {
      const absoluteFilePath = path.join(this.dir, this.fileName(id));
      const data = await fs.readFile(absoluteFilePath, { encoding: this.encoding });
      return JSON.parse(data) as T;
    } catch (e) {
      console.log(`Error reading index for id:${id}. ${e}`);
    }
  }

  async getIdList(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dir);
      if (!files || files.length === 0) return [];

      const fileNames: string[] = [];
      for (const file of files) {
        if (!file.endsWith(this.extension)) continue;
        fileNames.push(file.slice(0, -this.extension.length));
      }
      return fileNames;
    } catch (err) {
      console.log(`Error reading directory ${this.dir}: ${err}`);
      return [];
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const items: T[] = [];
      const ids = await this.getIdList();

      for (const id of ids) {
        const item = await this.get(id);
        if (item) items.push(item);
      }

      if (this.sort) items.sort(this.sort);
      return items;
    } catch (err) {
      console.log(`Error getting all files directory ${this.dir}: ${err}`);
      return [];
    }
  }

  private fileName(id: string): string {
    return `${id}${this.extension}`;
  }
}
