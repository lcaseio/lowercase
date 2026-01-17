import type {
  ArtifactsPort,
  ArtifactStorePort,
  GetError,
  JsonValue,
  PutError,
} from "@lcase/ports";
import { Result } from "@lcase/types";
import { createHash } from "node:crypto";

export class Artifacts implements ArtifactsPort {
  encoder: TextEncoder;
  decoder: TextDecoder;
  constructor(private readonly store: ArtifactStorePort) {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }
  async putJson(value: JsonValue): Promise<Result<string, PutError>> {
    try {
      const sortedJsonValue = this.sortJson(value);
      const json = JSON.stringify(sortedJsonValue);
      const bytes = this.encoder.encode(json);
      const hash = this.hashBytes(bytes);
      const result = await this.store.putBytes(hash, bytes);

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

      return { ok: true, value: hash };
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
          cause: "Unknown",
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
          message: "Error parsing json.",
          ...(e instanceof Error ? { cause: e.message } : {}),
        },
      };
    }
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
