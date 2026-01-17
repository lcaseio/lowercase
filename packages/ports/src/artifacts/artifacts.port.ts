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
  code: "UNKNOWN" | "STORE_PUT_FAILED";
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
export interface ArtifactsPort {
  putJson(value: JsonValue): Promise<Result<string, PutError>>;
  getJson(hash: string): Promise<Result<JsonValue, GetError>>;
}
