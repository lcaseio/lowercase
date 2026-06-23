import {
  ArtifactServicePort,
  ArtifactPutInput,
  ArtifactsPort,
} from "@lcase/ports";
import type { JsonValue, Result } from "@lcase/types";

export class ArtifactService implements ArtifactServicePort {
  constructor(private readonly artifacts: ArtifactsPort) {}

  async getArtifact(hash: string): Promise<Result<JsonValue, string>> {
    const result = await this.artifacts.getJson(hash);
    if (!result.ok) return { ok: false, error: result.error.message };
    return result;
  }

  async putArtifact(input: ArtifactPutInput): Promise<Result<string, string>> {
    if (input.value === undefined) return { ok: false, error: "undefined" };
    const result = await this.artifacts.put(input);
    if (!result.ok) return { ok: false, error: result.error.message };
    return result;
  }
}
