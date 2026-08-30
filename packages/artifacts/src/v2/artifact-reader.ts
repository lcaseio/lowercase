import type {
  ArtifactReaderPort,
  ArtifactLoadError,
  AutoLoadResult,
  ArtifactStorePort,
} from "@lcase/ports";
import type { JsonValue, Result } from "@lcase/types";

// Capability-module reader: the narrower half of the writer/reader split --
// only ArtifactStorePort, never ArtifactRepositoryPort. Built fresh,
// independent of the legacy Artifacts class and symmetric in structure to
// ArtifactWriter.
export class ArtifactReader implements ArtifactReaderPort {
  private readonly decoder = new TextDecoder();

  constructor(private readonly store: ArtifactStorePort) {}

  async load(hash: string): Promise<AutoLoadResult>;
  async load(
    hash: string,
    contentType: "application/json",
  ): Promise<Result<JsonValue, ArtifactLoadError>>;
  async load(
    hash: string,
    contentType: `text/${string}`,
  ): Promise<Result<string, ArtifactLoadError>>;
  async load(
    hash: string,
    contentType: string,
  ): Promise<Result<Uint8Array, ArtifactLoadError>>;
  async load(
    hash: string,
    contentType?: string,
  ): Promise<
    AutoLoadResult | Result<JsonValue | string | Uint8Array, ArtifactLoadError>
  > {
    const stored = await this.store.getBytes(hash);
    if (stored === null) {
      return {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: `No artifact found for hash "${hash}"`,
        },
      };
    }

    if (contentType !== undefined && contentType !== stored.contentType) {
      return {
        ok: false,
        error: {
          code: "TYPE_MISMATCH",
          message: `Expected contentType "${contentType}" but stored artifact has "${stored.contentType}"`,
        },
      };
    }

    try {
      const value = this.decodeContent(
        stored.bytes,
        contentType ?? stored.contentType,
      );
      if (contentType === undefined) {
        return { ok: true, contentType: stored.contentType, value };
      }
      return { ok: true, value };
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "DECODING_FAILED",
          message: e instanceof Error ? e.message : String(e),
        },
      };
    }
  }

  // Mirrors ArtifactWriter's encodeContent in reverse: application/json
  // parses, text/* decodes to a string, anything else passes through as raw
  // bytes -- there's no defined auto-decoding beyond that.
  private decodeContent(
    bytes: Uint8Array,
    contentType: string,
  ): JsonValue | string | Uint8Array {
    if (contentType === "application/json") {
      return JSON.parse(this.decoder.decode(bytes)) as JsonValue;
    }
    if (contentType.startsWith("text/")) {
      return this.decoder.decode(bytes);
    }
    return bytes;
  }
}
