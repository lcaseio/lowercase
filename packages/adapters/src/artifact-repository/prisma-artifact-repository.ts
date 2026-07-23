import type { PrismaClient } from "@lcase/db-prisma";
import type {
  ArtifactIndex,
  ArtifactListFilter,
  ArtifactListItem,
  ArtifactMetadata,
  Result,
} from "@lcase/types";
import type {
  ArtifactIndexStorePort,
  ArtifactRepositoryPort,
} from "@lcase/ports";

type PrismaArtifactRepositoryDb = Pick<
  PrismaClient,
  "artifact" | "artifactParamCuration" | "$transaction"
>;

function definedFields<T extends Record<string, unknown>>(
  input: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function toArtifactIndex(artifact: {
  hash: string;
  time: Date;
  label: string | null;
  filename: string | null;
  contentType: string | null;
  size: number | null;
  format: "json" | "text" | "markdown" | "bytes" | null;
  flowId: string | null;
  flowVersionId: string | null;
  curated: boolean;
}): ArtifactIndex {
  return {
    hash: artifact.hash,
    time: artifact.time.toISOString(),
    label: artifact.label ?? undefined,
    filename: artifact.filename ?? undefined,
    contentType: artifact.contentType ?? undefined,
    size: artifact.size ?? undefined,
    format: artifact.format ?? undefined,
    flowId: artifact.flowId ?? undefined,
    flowVersionId: artifact.flowVersionId ?? undefined,
    curated: artifact.curated,
  };
}

function toArtifactListItem(row: {
  hash: string;
  time: Date;
  label: string | null;
  filename: string | null;
  contentType: string | null;
  size: number | null;
  format: "json" | "text" | "markdown" | "bytes" | null;
  flowId: string | null;
  flowVersionId: string | null;
  curated: boolean;
  paramCurations?: { flowVersionId: string; paramName: string }[];
}): ArtifactListItem {
  return {
    artifact: {
      hash: row.hash,
      time: row.time.toISOString(),
      label: row.label ?? undefined,
      filename: row.filename ?? undefined,
      contentType: row.contentType ?? undefined,
      size: row.size ?? undefined,
      format: row.format ?? undefined,
    },
    associations: {
      flowId: row.flowId ?? undefined,
      flowVersionId: row.flowVersionId ?? undefined,
      curated: row.curated,
      paramCurations: (row.paramCurations ?? []).map((c) => ({
        flowVersionId: c.flowVersionId,
        paramName: c.paramName,
      })),
    },
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

  async getArtifacts(hashes: string[]): Promise<ArtifactIndex[]> {
    if (hashes.length === 0) return [];
    const artifacts = await this.db.artifact.findMany({
      where: { hash: { in: hashes } },
    });
    return artifacts.map(toArtifactIndex);
  }

  async listArtifactHashes(): Promise<string[]> {
    return this.getIndexList();
  }

  async listArtifacts(
    filter?: ArtifactListFilter,
  ): Promise<ArtifactListItem[]> {
    const rows = await this.db.artifact.findMany({
      where: filter ? definedFields(filter) : undefined,
      orderBy: [{ time: "desc" }, { hash: "desc" }],
      include: {
        paramCurations: filter?.flowVersionId
          ? { where: { flowVersionId: filter.flowVersionId } }
          : false,
      },
    });
    return rows.map(toArtifactListItem);
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
          flowId: index.flowId,
          flowVersionId: index.flowVersionId,
          curated: index.curated,
        },
        create: {
          hash: index.hash,
          time: new Date(index.time),
          label: index.label,
          filename: index.filename,
          contentType: index.contentType,
          size: index.size,
          format: index.format,
          flowId: index.flowId,
          flowVersionId: index.flowVersionId,
          curated: index.curated,
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

  async updateMetadata(
    hash: string,
    metadata: ArtifactMetadata,
  ): Promise<Result<ArtifactIndex, string>> {
    try {
      const data = {
        label: metadata.label,
        flowId: metadata.flowId,
        flowVersionId: metadata.flowVersionId,
        curated: true,
      };

      if (!metadata.paramCurations) {
        const updated = await this.db.artifact.update({
          where: { hash },
          data,
        });
        return { ok: true, value: toArtifactIndex(updated) };
      }

      const flowVersionId = metadata.flowVersionId;
      const paramCurations = metadata.paramCurations;
      const updated = await this.db.$transaction(async (tx) => {
        const artifact = await tx.artifact.update({ where: { hash }, data });
        await tx.artifactParamCuration.deleteMany({
          where: { artifactHash: hash, flowVersionId },
        });
        if (paramCurations.length > 0) {
          await tx.artifactParamCuration.createMany({
            data: paramCurations.map((paramName) => ({
              artifactHash: hash,
              flowVersionId,
              paramName,
            })),
          });
        }
        return artifact;
      });
      return { ok: true, value: toArtifactIndex(updated) };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to update artifact metadata: ${String(error)}`,
      };
    }
  }

  async listCuratedArtifacts(
    flowVersionId: string,
    paramName: string,
  ): Promise<ArtifactIndex[]> {
    const entries = await this.db.artifactParamCuration.findMany({
      where: { flowVersionId, paramName },
    });
    return this.getArtifacts(entries.map((entry) => entry.artifactHash));
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
