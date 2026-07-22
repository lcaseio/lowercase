import {
  AutoGetResult,
  ArtifactRepositoryPort,
  ArtifactServicePort,
  ArtifactPutInput,
  ArtifactsPort,
  FlowRepositoryPort,
} from "@lcase/ports";
import type {
  ArtifactAssociation,
  ArtifactIndex,
  ArtifactListFilter,
  FlowDefinition,
  Result,
} from "@lcase/types";

export class ArtifactService implements ArtifactServicePort {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly artifactRepository: ArtifactRepositoryPort,
    private readonly flowRepository: FlowRepositoryPort,
  ) {}

  async getArtifact(hash: string): Promise<AutoGetResult> {
    return this.artifacts.getAuto(hash);
  }

  async listArtifacts(filter?: ArtifactListFilter): Promise<ArtifactIndex[]> {
    const artifacts = await this.artifactRepository.listArtifacts(filter);
    return artifacts.sort((a, b) => b.time.localeCompare(a.time));
  }

  async putArtifact(input: ArtifactPutInput): Promise<Result<string, string>> {
    if (input.value === undefined) return { ok: false, error: "undefined" };
    const result = await this.artifacts.put(input);
    if (!result.ok) return { ok: false, error: result.error.message };
    return result;
  }

  async associateArtifact(
    hash: string,
    association: ArtifactAssociation,
  ): Promise<Result<ArtifactIndex, string>> {
    return this.artifactRepository.associateArtifact(hash, association);
  }

  async curateArtifactForParam(
    artifactHash: string,
    flowVersionId: string,
    paramName: string,
    crossVersion = false,
  ): Promise<Result<ArtifactIndex, string>> {
    const versionResult =
      await this.flowRepository.getFlowVersion(flowVersionId);
    if (!versionResult.ok) return versionResult;

    const definitionResult = await this.artifacts.getJson(
      versionResult.value.definitionHash,
    );
    if (!definitionResult.ok) {
      return { ok: false, error: definitionResult.error.message };
    }

    const definition = definitionResult.value as FlowDefinition;
    if (!definition.params?.[paramName]) {
      return { ok: false, error: `Undeclared param: ${paramName}` };
    }

    const association: ArtifactAssociation = {
      flowVersionId,
      curated: true,
      ...(crossVersion ? { flowId: versionResult.value.flowId } : {}),
    };

    const associated = await this.artifactRepository.associateArtifact(
      artifactHash,
      association,
    );
    if (!associated.ok) return associated;

    const curated = await this.artifactRepository.curateArtifactForParam({
      artifactHash,
      flowVersionId,
      paramName,
    });
    if (!curated.ok) return { ok: false, error: curated.error };

    return associated;
  }

  async uncurateArtifactForParam(
    artifactHash: string,
    flowVersionId: string,
    paramName: string,
  ): Promise<Result<void, string>> {
    return this.artifactRepository.uncurateArtifactForParam({
      artifactHash,
      flowVersionId,
      paramName,
    });
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
