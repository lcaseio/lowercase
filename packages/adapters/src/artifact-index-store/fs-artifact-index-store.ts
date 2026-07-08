import type { ArtifactIndexStorePort } from "@lcase/ports";
import type { ArtifactIndex, Result } from "@lcase/types";
import fs from "node:fs/promises";
import path from "node:path";

export class FsArtifactIndexStore implements ArtifactIndexStorePort {
  baseDir: string;
  rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.baseDir = path.join(this.rootPath);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async put(index: ArtifactIndex): Promise<Result<ArtifactIndex, string>> {
    try {
      const json = JSON.stringify(index, null, 2);
      const absoluteFilePath = this.getAbsoluteFilePath(index.hash);
      await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
      await fs.writeFile(absoluteFilePath, json, { encoding: "utf8" });
      return { ok: true, value: index };
    } catch (e) {
      return { ok: false, error: `Error writing artifact index: ${e}` };
    }
  }

  async get(hash: string): Promise<ArtifactIndex | undefined> {
    try {
      const absoluteFilePath = this.getAbsoluteFilePath(hash);
      const data = await fs.readFile(absoluteFilePath, { encoding: "utf8" });
      return JSON.parse(data) as ArtifactIndex;
    } catch (e) {
      return undefined;
    }
  }

  async getIndexList(): Promise<string[]> {
    try {
      const filePaths = await this.listIndexFiles(this.baseDir);
      return filePaths
        .map((filePath) => this.hashFromIndexPath(filePath))
        .filter((hash): hash is string => Boolean(hash));
    } catch (err) {
      console.log(`Error reading directory ${this.baseDir}: ${err}`);
      return [];
    }
  }

  async getAll(): Promise<ArtifactIndex[]> {
    try {
      const indexes: ArtifactIndex[] = [];
      const hashes = await this.getIndexList();
      for (const hash of hashes) {
        const index = await this.get(hash);
        if (index) indexes.push(index);
      }
      return indexes;
    } catch (err) {
      console.log(`Error getting all files directory ${this.baseDir}: ${err}`);
      return [];
    }
  }

  private getAbsoluteFilePath(hash: string): string {
    return path.join(this.getAbsoluteDirPath(hash), this.getFileName(hash));
  }

  private getFileName(hash: string): string {
    return `${hash.slice(4)}.index.json`;
  }

  private getAbsoluteDirPath(hash: string): string {
    const dirOne = hash.slice(0, 2);
    const dirTwo = hash.slice(2, 4);
    return path.join(this.baseDir, dirOne, dirTwo);
  }

  private async listIndexFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.listIndexFiles(absolutePath)));
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".index.json")) {
        files.push(absolutePath);
      }
    }

    return files;
  }

  private hashFromIndexPath(filePath: string): string | null {
    const relative = path.relative(this.baseDir, filePath);
    const parts = relative.split(path.sep);
    if (parts.length < 3) return null;
    const [dirOne, dirTwo, fileName] = parts.slice(-3);
    if (!fileName.endsWith(".index.json")) return null;
    const base = fileName.slice(0, -".index.json".length);
    return `${dirOne}${dirTwo}${base}`;
  }
}
