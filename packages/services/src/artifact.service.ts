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
  ArtifactMetadata,
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

  async updateArtifactMetadata(
    hash: string,
    metadata: ArtifactMetadata,
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
