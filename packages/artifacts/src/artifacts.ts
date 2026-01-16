import type {
  ArtifactsPort,
  ArtifactStorePort,
  JsonValue,
  PutError,
} from "@lcase/ports";
import { Result } from "@lcase/types";
import { createHash } from "node:crypto";

export class Artifacts implements ArtifactsPort {
  constructor(private readonly store: ArtifactStorePort) {}
  putJson(value: JsonValue): Result<string, PutError> {
    try {
      const sortedJsonValue = this.sortJson(value);
      const json = JSON.stringify(sortedJsonValue);
      const hash = this.hashJson(json);
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

  getJson(hash: string): JsonValue {
    throw new Error("Method not implemented.");
  }

  hashJson(json: string): string {
    return createHash("sha256").update(json).digest("hex");
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
