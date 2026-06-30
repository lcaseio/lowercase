import type { PrismaClient } from "@lcase/db-prisma";
import type { ArtifactIndex, Result } from "@lcase/types";
import type {
  ArtifactIndexStorePort,
  ArtifactRepositoryPort,
} from "@lcase/ports";

type PrismaArtifactRepositoryDb = Pick<PrismaClient, "artifact">;

function toArtifactIndex(artifact: {
  hash: string;
  time: Date;
  label: string | null;
  filename: string | null;
  contentType: string | null;
  size: number | null;
  format: "json" | "text" | "markdown" | "bytes" | null;
}): ArtifactIndex {
  return {
    hash: artifact.hash,
    time: artifact.time.toISOString(),
    label: artifact.label ?? undefined,
    filename: artifact.filename ?? undefined,
    contentType: artifact.contentType ?? undefined,
    size: artifact.size ?? undefined,
    format: artifact.format ?? undefined,
  };
}

export class PrismaArtifactRepository
  implements ArtifactRepositoryPort, ArtifactIndexStorePort
{
  constructor(private readonly db: PrismaArtifactRepositoryDb) {}

  async init(): Promise<void> {}

  async saveArtifact(
    index: ArtifactIndex,
  ): Promise<Result<ArtifactIndex, string>> {
    return this.put(index);
  }

  async getArtifact(hash: string): Promise<ArtifactIndex | undefined> {
    return this.get(hash);
  }

  async listArtifactHashes(): Promise<string[]> {
    return this.getIndexList();
  }

  async listArtifacts(): Promise<ArtifactIndex[]> {
    return this.getAll();
  }

  async put(index: ArtifactIndex): Promise<Result<ArtifactIndex, string>> {
    try {
      const saved = await this.db.artifact.upsert({
        where: { hash: index.hash },
        update: {
          time: new Date(index.time),
          label: index.label,
          filename: index.filename,
          contentType: index.contentType,
          size: index.size,
          format: index.format,
        },
        create: {
          hash: index.hash,
          time: new Date(index.time),
          label: index.label,
          filename: index.filename,
          contentType: index.contentType,
          size: index.size,
          format: index.format,
        },
      });
      return { ok: true, value: toArtifactIndex(saved) };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to save artifact metadata: ${String(error)}`,
      };
    }
  }

  async get(hash: string): Promise<ArtifactIndex | undefined> {
    try {
      const artifact = await this.db.artifact.findUnique({ where: { hash } });
      return artifact ? toArtifactIndex(artifact) : undefined;
    } catch {
      return undefined;
    }
  }

  async getIndexList(): Promise<string[]> {
    const artifacts = await this.db.artifact.findMany({
      orderBy: [{ time: "desc" }, { hash: "desc" }],
      select: { hash: true },
    });
    return artifacts.map((artifact) => artifact.hash);
  }

  async getAll(): Promise<ArtifactIndex[]> {
    const artifacts = await this.db.artifact.findMany({
      orderBy: [{ time: "desc" }, { hash: "desc" }],
    });
    return artifacts.map(toArtifactIndex);
  }
}
