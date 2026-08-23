import {
  AutoGetResult,
  ArtifactRepositoryPort,
  ArtifactServicePort,
  ArtifactPutInput,
  ArtifactsPort,
  FlowRepositoryPort,
} from "@lcase/ports";
import type {
  ArtifactIndex,
  ArtifactListFilter,
  ArtifactListItem,
  ArtifactUpdateMetadata,
  ArtifactWriteMetadata,
  FlowDefinition,
  Result,
} from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";

export class ArtifactService implements ArtifactServicePort {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly artifactRepository: ArtifactRepositoryPort,
    private readonly flowRepository: FlowRepositoryPort,
  ) {}

  async getArtifact(hash: string): Promise<AutoGetResult> {
    return this.artifacts.getAuto(hash);
  }

  async listArtifacts(
    filter?: ArtifactListFilter,
  ): Promise<ArtifactListItem[]> {
    const artifacts = await this.artifactRepository.listArtifacts(filter);
    return artifacts.sort((a, b) =>
      b.artifact.time.localeCompare(a.artifact.time),
    );
  }

  async putArtifact(input: ArtifactPutInput): Promise<Result<string, string>> {
    if (input.value === undefined) return { ok: false, error: "undefined" };
    const result = await this.artifacts.put(input);
    if (!result.ok) return { ok: false, error: result.error.message };
    return result;
  }

  async createArtifact(
    input: ArtifactPutInput,
    metadata?: ArtifactUpdateMetadata,
  ): Promise<Result<ArtifactIndex, string>> {
    if (input.value === undefined) return { ok: false, error: "undefined" };
    // temporary -- binary artifacts have no content viewer and can never
    // satisfy any param's compatible type (isArtifactCompatible has no
    // "bytes" case), so creation rejects them for now rather than
    // producing an artifact the rest of the system can't do anything
    // useful with yet. Revisit once binary is actually supported end to
    // end (see docs/todo.md).
    if (input.format === "bytes") {
      return { ok: false, error: "Binary artifacts are not supported yet" };
    }

    if (metadata?.paramCurations) {
      const versionResult = await this.flowRepository.getFlowVersion(
        metadata.flowVersionId,
      );
      if (!versionResult.ok) return versionResult;

      const definitionResult = await this.artifacts.getJson(
        versionResult.value.definitionHash,
      );
      if (!definitionResult.ok) {
        return { ok: false, error: definitionResult.error.message };
      }
      const definition = definitionResult.value as FlowDefinition;

      for (const paramName of metadata.paramCurations) {
        const paramDef = definition.params?.[paramName];
        if (!paramDef) {
          return { ok: false, error: `Undeclared param: ${paramName}` };
        }
        // isArtifactCompatible only ever reads contentType/format at
        // runtime, never persisted-only fields like hash/time -- validating
        // against the not-yet-written input is equivalent to validating the
        // persisted artifact after the fact, and lets creation reject an
        // incompatible param before writing anything, unlike the edit path
        // (which validates an artifact that already exists)
        const pending = {
          format: input.format,
          contentType: input.index?.contentType,
        } as ArtifactIndex;
        if (!isArtifactCompatible(pending, paramDef.type)) {
          return {
            ok: false,
            error: `Artifact incompatible with param: ${paramName}`,
          };
        }
      }
    }

    // curated must come last -- metadata arrives over the wire as parsed
    // JSON, untyped at runtime, so a client could send its own `curated`
    // key despite ArtifactUpdateMetadata never declaring one; spreading
    // metadata first means this always wins over anything it might contain
    const writeMetadata: ArtifactWriteMetadata = {
      ...(metadata ?? {}),
      curated: true,
    };
    const result = await this.artifacts.write(input, writeMetadata);
    if (!result.ok) return { ok: false, error: result.error.message };
    return result;
  }

  async updateArtifactMetadata(
    hash: string,
    metadata: ArtifactUpdateMetadata,
  ): Promise<Result<ArtifactIndex, string>> {
    if (metadata.paramCurations) {
      const versionResult = await this.flowRepository.getFlowVersion(
        metadata.flowVersionId,
      );
      if (!versionResult.ok) return versionResult;

      const definitionResult = await this.artifacts.getJson(
        versionResult.value.definitionHash,
      );
      if (!definitionResult.ok) {
        return { ok: false, error: definitionResult.error.message };
      }
      const definition = definitionResult.value as FlowDefinition;

      const artifact = await this.artifactRepository.getArtifact(hash);
      if (!artifact) return { ok: false, error: `Artifact not found: ${hash}` };

      for (const paramName of metadata.paramCurations) {
        const paramDef = definition.params?.[paramName];
        if (!paramDef) {
          return { ok: false, error: `Undeclared param: ${paramName}` };
        }
        if (!isArtifactCompatible(artifact, paramDef.type)) {
          return {
            ok: false,
            error: `Artifact incompatible with param: ${paramName}`,
          };
        }
      }
    }

    return this.artifactRepository.updateMetadata(hash, metadata);
  }

  async listCuratedArtifacts(
    flowVersionId: string,
    paramName: string,
  ): Promise<ArtifactIndex[]> {
    return this.artifactRepository.listCuratedArtifacts(
      flowVersionId,
      paramName,
    );
  }
}
