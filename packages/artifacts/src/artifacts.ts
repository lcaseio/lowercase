import type {
  ArtifactsPort,
  ArtifactStorePort,
  AutoGetResult,
  GetError,
  JsonValue,
  PutError,
} from "@lcase/ports";
import type { ArtifactIndexStorePort } from "@lcase/ports";
import type {
  Result,
  ArtifactPutInput,
  ArtifactIndexInput,
  ArtifactFormat,
} from "@lcase/types";
import { createHash } from "node:crypto";

const artifactFileExtensions: Record<ArtifactFormat, string> = {
  json: ".json",
  text: ".txt",
  markdown: ".md",
  bytes: ".bin",
};

export class Artifacts implements ArtifactsPort {
  encoder: TextEncoder;
  decoder: TextDecoder;
  constructor(
    private readonly store: ArtifactStorePort,
    private readonly indexStore?: ArtifactIndexStorePort,
  ) {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  async put(input: ArtifactPutInput): Promise<Result<string, PutError>> {
    switch (input.format) {
      case "json":
        return this.putJson(input.value, input.index);
      case "text":
        return this.putText(input.value, input.index);
      case "markdown":
        return this.putMarkdown(input.value, input.index);
      case "bytes":
        return this.putBytes(input.value, input.index);
    }
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Unsupported artifact format",
      },
    };
  }

  async get(
    hash: string,
    opts: { format: "json" },
  ): Promise<Result<JsonValue, GetError>>;
  async get(
    hash: string,
    opts: { format: "text" },
  ): Promise<Result<string, GetError>>;
  async get(
    hash: string,
    opts: { format: "markdown" },
  ): Promise<Result<string, GetError>>;
  async get(
    hash: string,
    opts: { format: "bytes" },
  ): Promise<Result<Uint8Array, GetError>>;
  async get(
    hash: string,
    opts: { format: "json" | "text" | "markdown" | "bytes" },
  ): Promise<Result<JsonValue | string | Uint8Array, GetError>> {
    switch (opts.format) {
      case "json":
        return this.getJson(hash);
      case "text":
        return this.getText(hash);
      case "markdown":
        return this.getMarkdown(hash);
      case "bytes":
        return this.getBytes(hash);
    }
  }

  async getAuto(hash: string): Promise<AutoGetResult> {
    const index = await this.indexStore?.get(hash);
    const format = this.inferFormat(index?.format, index?.contentType);

    switch (format) {
      case "json": {
        const result = await this.getJson(hash);
        if (!result.ok) return { ok: false, error: result.error };
        return { ok: true, format: "json", value: result.value };
      }
      case "markdown": {
        const result = await this.getMarkdown(hash);
        if (!result.ok) return { ok: false, error: result.error };
        return { ok: true, format: "markdown", value: result.value };
      }
      case "text": {
        const result = await this.getText(hash);
        if (!result.ok) return { ok: false, error: result.error };
        return { ok: true, format: "text", value: result.value };
      }
      default: {
        const result = await this.getBytes(hash);
        if (!result.ok) return { ok: false, error: result.error };
        return { ok: true, format: "bytes", value: result.value };
      }
    }
  }
  async putJson(
    value: JsonValue,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>> {
    try {
      const sortedJsonValue = this.sortJson(value);
      const json = JSON.stringify(sortedJsonValue);
      const bytes = this.encoder.encode(json);
      return await this.putBytesInternal(bytes, index, "json");
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "UNKNOWN",
          message: "Error putting json",
          cause: e instanceof Error ? e.message : String(e),
        },
      };
    }
  }

  async getJson(hash: string): Promise<Result<JsonValue, GetError>> {
    const bytes = await this.store.getBytes(hash);
    if (bytes === null)
      return {
        ok: false,
        error: {
          code: "STORE_GET_FAILED",
          message: "Store returned null",
        },
      };
    const json = this.decoder.decode(bytes);
    try {
      const result = JSON.parse(json) as JsonValue;
      return { ok: true, value: result };
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "JSON_PARSE_FAILED",
          message: "Error parsing json",
          ...(e instanceof Error ? { cause: e.message } : {}),
        },
      };
    }
  }

  async putText(
    value: string,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>> {
    try {
      const bytes = this.encoder.encode(value);
      return await this.putBytesInternal(bytes, index, "text");
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "UNKNOWN",
          message: "Error putting text",
          cause: e instanceof Error ? e.message : String(e),
        },
      };
    }
  }

  async putMarkdown(
    value: string,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>> {
    try {
      const bytes = this.encoder.encode(value);
      return await this.putBytesInternal(bytes, index, "markdown");
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "UNKNOWN",
          message: "Error putting markdown",
          cause: e instanceof Error ? e.message : String(e),
        },
      };
    }
  }

  async getText(hash: string): Promise<Result<string, GetError>> {
    const bytesResult = await this.getBytes(hash);
    if (!bytesResult.ok) return { ok: false, error: bytesResult.error };
    return { ok: true, value: this.decoder.decode(bytesResult.value) };
  }

  async getMarkdown(hash: string): Promise<Result<string, GetError>> {
    return this.getText(hash);
  }

  async putBytes(
    bytes: Uint8Array,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>> {
    return this.putBytesInternal(bytes, index, "bytes");
  }

  private async putBytesInternal(
    bytes: Uint8Array,
    index: ArtifactIndexInput | undefined,
    format: ArtifactFormat,
  ): Promise<Result<string, PutError>> {
    try {
      const hash = this.hashBytes(bytes);
      const extension = artifactFileExtensions[format];
      const result = await this.store.putBytes(hash, bytes, extension);

      if (!result.ok) {
        return {
          ok: false,
          error: {
            code: "STORE_PUT_FAILED",
            message: "Error putting bytes in store",
            cause: result.cause,
          },
        };
      }

      const indexResult = await this.putIndex(
        hash,
        index,
        bytes.length,
        format,
      );
      if (!indexResult.ok) return indexResult;

      return { ok: true, value: hash };
    } catch (e) {
      return {
        ok: false,
        error: {
          code: "UNKNOWN",
          message: "Error putting bytes",
          cause: e instanceof Error ? e.message : String(e),
        },
      };
    }
  }

  async getBytes(hash: string): Promise<Result<Uint8Array, GetError>> {
    const bytes = await this.store.getBytes(hash);
    if (bytes === null)
      return {
        ok: false,
        error: {
          code: "STORE_GET_FAILED",
          message: "Store returned null",
        },
      };
    return { ok: true, value: bytes };
  }

  private async putIndex(
    hash: string,
    index: ArtifactIndexInput | undefined,
    size: number,
    format: ArtifactFormat,
  ): Promise<Result<string, PutError>> {
    if (!this.indexStore) return { ok: true, value: hash };

    const defaultContentType =
      format === "json"
        ? "application/json"
        : format === "markdown"
          ? "text/markdown"
          : format === "text"
            ? "text/plain"
            : "application/octet-stream";

    const indexResult = await this.indexStore.put({
      time: index?.time ?? new Date().toISOString(),
      size,
      contentType: defaultContentType,
      format,
      ...(index ?? {}),
      hash,
    });

    if (!indexResult.ok) {
      return {
        ok: false,
        error: {
          code: "INDEX_PUT_FAILED",
          message: "Error putting artifact index",
          cause: indexResult.error,
          details: { hash },
        },
      };
    }

    return { ok: true, value: hash };
  }

  private inferFormat(
    format: ArtifactFormat | undefined,
    contentType: string | undefined,
  ): ArtifactFormat {
    if (format) return format;
    if (!contentType) return "bytes";
    if (contentType === "application/json") return "json";
    if (contentType === "text/markdown") return "markdown";
    if (contentType.startsWith("text/")) return "text";
    return "bytes";
  }

  hashBytes(bytes: Uint8Array): string {
    return createHash("sha256").update(bytes).digest("hex");
  }

  sortJson(value: JsonValue): JsonValue {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortJson(item));
    }
    if (this.isObject(value)) {
      const sorted: Record<string, JsonValue> = {};
      for (const key of Object.keys(value).sort()) {
        sorted[key] = this.sortJson(value[key]);
      }
      return sorted;
    }
    return value;
  }

  isObject(value: JsonValue): value is Record<string, JsonValue> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
