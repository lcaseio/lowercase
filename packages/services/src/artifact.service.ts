import {
  AutoGetResult,
  ArtifactIndexStorePort,
  ArtifactServicePort,
  ArtifactPutInput,
  ArtifactsPort,
} from "@lcase/ports";
import type { ArtifactIndex, Result } from "@lcase/types";

export class ArtifactService implements ArtifactServicePort {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly artifactIndexStore: ArtifactIndexStorePort,
  ) {}

  async getArtifact(hash: string): Promise<AutoGetResult> {
    return this.artifacts.getAuto(hash);
  }

  async listArtifacts(): Promise<ArtifactIndex[]> {
    const artifacts = await this.artifactIndexStore.getAll();
    return artifacts.sort((a, b) => b.time.localeCompare(a.time));
  }

  async putArtifact(input: ArtifactPutInput): Promise<Result<string, string>> {
    if (input.value === undefined) return { ok: false, error: "undefined" };
    const result = await this.artifacts.put(input);
    if (!result.ok) return { ok: false, error: result.error.message };
    return result;
  }
}
