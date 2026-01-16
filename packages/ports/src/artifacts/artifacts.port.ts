import { Result } from "@lcase/types";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [I in string]: JsonValue };

export type PutResponse = {
  hash?: string;
  error?: string;
};

export type PutError = {
  code: "UNKNOWN" | "HASH_FAILED" | "SERIALIZE_FAILED";
  message: string;
  cause?: string;
  details?: Record<string, string>;
};
export interface ArtifactsPort {
  putJson(value: JsonValue): Result<string, PutError>;
  getJson(hash: string): JsonValue;
  hashJson(value: string): string;
}
