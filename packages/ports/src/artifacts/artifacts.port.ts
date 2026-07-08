import type {
  ArtifactIndexInput,
  ArtifactPutInput,
  JsonValue,
  Result,
} from "@lcase/types";

export type PutResponse = {
  hash?: string;
  error?: string;
};

export type PutError = {
  code: "UNKNOWN" | "STORE_PUT_FAILED" | "INDEX_PUT_FAILED";
  message: string;
  cause?: string;
  details?: Record<string, string>;
};

export type GetError = {
  code: "STORE_GET_FAILED" | "JSON_PARSE_FAILED";
  message: string;
  cause?: string;
  details?: Record<string, string>;
};

export type AutoGetResult =
  | { ok: true; format: "json"; value: JsonValue }
  | { ok: true; format: "text" | "markdown"; value: string }
  | { ok: true; format: "bytes"; value: Uint8Array }
  | { ok: false; error: GetError };

export type { ArtifactIndexInput, ArtifactPutInput, JsonValue };

export interface ArtifactsPort {
  put(input: ArtifactPutInput): Promise<Result<string, PutError>>;

  get(
    hash: string,
    opts: { format: "json" },
  ): Promise<Result<JsonValue, GetError>>;
  get(
    hash: string,
    opts: { format: "text" },
  ): Promise<Result<string, GetError>>;
  get(
    hash: string,
    opts: { format: "markdown" },
  ): Promise<Result<string, GetError>>;
  get(
    hash: string,
    opts: { format: "bytes" },
  ): Promise<Result<Uint8Array, GetError>>;

  getAuto(hash: string): Promise<AutoGetResult>;

  putJson(
    value: JsonValue,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>>;
  getJson(hash: string): Promise<Result<JsonValue, GetError>>;
  putText(
    value: string,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>>;
  putMarkdown(
    value: string,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>>;
  getText(hash: string): Promise<Result<string, GetError>>;
  getMarkdown(hash: string): Promise<Result<string, GetError>>;
  putBytes(
    bytes: Uint8Array,
    index?: ArtifactIndexInput,
  ): Promise<Result<string, PutError>>;
  getBytes(hash: string): Promise<Result<Uint8Array, GetError>>;
}
