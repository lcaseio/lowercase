import type { PrismaClient } from "@lcase/db-prisma";
import type {
  ArtifactAssociation,
  ArtifactIndex,
  ArtifactParamCurationRecord,
  Result,
} from "@lcase/types";
import type {
  ArtifactIndexStorePort,
  ArtifactRepositoryPort,
} from "@lcase/ports";

type PrismaArtifactRepositoryDb = Pick<
  PrismaClient,
  "artifact" | "artifactParamCuration"
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

  async associateArtifact(
    hash: string,
    association: ArtifactAssociation,
  ): Promise<Result<ArtifactIndex, string>> {
    try {
      const saved = await this.db.artifact.update({
        where: { hash },
        data: definedFields(association),
      });
      return { ok: true, value: toArtifactIndex(saved) };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to associate artifact: ${String(error)}`,
      };
    }
  }

  async curateArtifactForParam(
    entry: ArtifactParamCurationRecord,
  ): Promise<Result<void, string>> {
    try {
      await this.db.artifactParamCuration.upsert({
        where: {
          artifactHash_flowVersionId_paramName: {
            artifactHash: entry.artifactHash,
            flowVersionId: entry.flowVersionId,
            paramName: entry.paramName,
          },
        },
        update: {},
        create: entry,
      });
      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to curate artifact for param: ${String(error)}`,
      };
    }
  }

  async uncurateArtifactForParam(
    entry: ArtifactParamCurationRecord,
  ): Promise<Result<void, string>> {
    try {
      await this.db.artifactParamCuration.delete({
        where: {
          artifactHash_flowVersionId_paramName: {
            artifactHash: entry.artifactHash,
            flowVersionId: entry.flowVersionId,
            paramName: entry.paramName,
          },
        },
      });
      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to uncurate artifact for param: ${String(error)}`,
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
