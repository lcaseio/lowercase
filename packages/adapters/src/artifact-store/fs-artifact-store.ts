import type {
  ArtifactStorePort,
  ArtifactStoreGetResult,
  ArtifactStorePutResult,
} from "@lcase/ports";
import {
  readFile,
  writeFile,
  rename,
  unlink,
  mkdir,
  access,
} from "node:fs/promises";
import path from "node:path";

// Content-type travels with the blob as a small sidecar file -- local disk
// has no equivalent to an S3/MinIO object's native Content-Type metadata, so
// this plays that role instead. Content itself has no extension: there's no
// longer a closed set of formats to encode into a filename, and nothing
// needs to probe for it on read since the sidecar always says what it is.
export class FsArtifactStore implements ArtifactStorePort {
  baseDir: string;
  constructor(rootPath: string) {
    this.baseDir = path.join(rootPath);
  }

  async putBytes(
    hash: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<ArtifactStorePutResult> {
    const absoluteFilePath = this.getAbsoluteFilePath(hash);
    const absoluteMetaPath = this.getAbsoluteMetaPath(hash);
    const tmpContentPath = absoluteFilePath + ".tmp";
    const tmpMetaPath = absoluteMetaPath + ".tmp";

    try {
      // idempotent: same hash means same content by definition. If a later
      // save declares a different contentType for the same bytes, the first
      // write's declared type wins -- hashing is content-only, not
      // content+type (see docs/todo.md's ArtifactIndex naming-debt entry).
      if (await this.exists(absoluteFilePath)) {
        return { ok: true, path: absoluteFilePath };
      }

      await mkdir(path.dirname(absoluteFilePath), { recursive: true });

      // Write-then-rename: atomic per file (a reader sees the final path
      // fully written or not at all, never partial) -- not atomic across the
      // content+meta pair, see getBytes' fail-closed handling for that gap.
      try {
        await writeFile(tmpContentPath, bytes);
        await writeFile(tmpMetaPath, JSON.stringify({ contentType }));
        await rename(tmpContentPath, absoluteFilePath);
        await rename(tmpMetaPath, absoluteMetaPath);
      } finally {
        await this.cleanupTmp(tmpContentPath);
        await this.cleanupTmp(tmpMetaPath);
      }
    } catch (e) {
      return {
        ok: false,
        cause: e instanceof Error ? e.message : "Error putting bytes",
      };
    }

    return { ok: true, path: absoluteFilePath };
  }

  async getBytes(hash: string): Promise<ArtifactStoreGetResult | null> {
    const absoluteFilePath = this.getAbsoluteFilePath(hash);
    const absoluteMetaPath = this.getAbsoluteMetaPath(hash);

    try {
      const [bytes, metaRaw] = await Promise.all([
        readFile(absoluteFilePath),
        readFile(absoluteMetaPath, "utf-8"),
      ]);
      const { contentType } = JSON.parse(metaRaw) as { contentType: string };
      return { bytes, contentType };
    } catch {
      // fail closed: content without its sidecar (or vice versa) is treated
      // as not-found rather than returned with an unknown content-type.
      return null;
    }
  }

  private getAbsoluteFilePath(hash: string): string {
    return path.join(this.getAbsoluteDirPath(hash), hash.slice(4));
  }

  private getAbsoluteMetaPath(hash: string): string {
    return path.join(
      this.getAbsoluteDirPath(hash),
      hash.slice(4) + ".meta.json",
    );
  }

  private getAbsoluteDirPath(hash: string): string {
    return path.join(this.baseDir, hash.slice(0, 2), hash.slice(2, 4));
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Always attempts the unlink rather than checking first -- on success
  // rename() already moved the file away, so this is a guaranteed no-op.
  private async cleanupTmp(tmpPath: string): Promise<void> {
    try {
      await unlink(tmpPath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        // TODO: surface this through observability once a real error-handling
        // convention exists (docs/todo.md) -- silently logged for now.
        console.log("Error unlinking temp file:", e);
      }
    }
  }
}
