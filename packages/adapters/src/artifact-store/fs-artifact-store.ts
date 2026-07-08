import type { ArtifactStorePort, ArtifactStorePutResult } from "@lcase/ports";
import {
  readFile,
  writeFile,
  rename,
  unlink,
  mkdir,
  access,
} from "node:fs/promises";
import path from "node:path";

const artifactFileExtensions = [".json", ".txt", ".md", ".bin"] as const;

export class FsArtifactStore implements ArtifactStorePort {
  baseDir: string;
  rootPath: string;
  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.baseDir = path.join(this.rootPath);
  }
  async putBytes(
    hash: string,
    bytes: Uint8Array,
    extension: string,
  ): Promise<ArtifactStorePutResult> {
    const absoluteTempFilePath = this.getAbsoluteFilePath(hash, extension, true);
    const absoluteFilePath = this.getAbsoluteFilePath(hash, extension);

    try {
      // idempotent writes
      if (await this.exists(absoluteFilePath)) {
        return { ok: true, path: absoluteFilePath };
      }
      await mkdir(path.dirname(absoluteTempFilePath), { recursive: true });
      await writeFile(absoluteTempFilePath, bytes);
      await rename(absoluteTempFilePath, absoluteFilePath);
    } catch (e) {
      return {
        ok: false,
        cause: e instanceof Error ? e.message : "Error putting bytes",
      };
    } finally {
      try {
        // in case renaming or writing fails
        await unlink(absoluteTempFilePath);
      } catch (e) {
        // ignore file not found error, otherwise console log
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
          console.log("Error unlinking file:", e);
        }
      }
    }

    return { ok: true, path: absoluteFilePath };
  }
  async getBytes(hash: string): Promise<Uint8Array | null> {
    const absoluteFilePath = await this.findAbsoluteFilePath(hash);
    if (!absoluteFilePath) return null;
    try {
      const buffer = await readFile(absoluteFilePath);
      return buffer;
    } catch (e) {
      return null;
    }
  }

  getAbsoluteFilePath(
    hash: string,
    extension: string,
    tmp: boolean = false,
  ): string {
    return path.join(
      this.getAbsoluteDirPath(hash),
      this.getFileName(hash, extension, tmp),
    );
  }

  getFileName(hash: string, extension: string, tmp: boolean = false): string {
    return hash.slice(4) + extension + (tmp ? ".tmp" : "");
  }

  getAbsoluteDirPath(hash: string) {
    const dirOne = hash.slice(0, 2);
    const dirTwo = hash.slice(2, 4);
    return path.join(this.baseDir, dirOne, dirTwo);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  async findAbsoluteFilePath(hash: string): Promise<string | null> {
    for (const extension of Object.values(artifactFileExtensions)) {
      const absoluteFilePath = this.getAbsoluteFilePath(hash, extension);
      if (await this.exists(absoluteFilePath)) return absoluteFilePath;
    }

    return null;
  }
}
