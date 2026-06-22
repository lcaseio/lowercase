import type { JsonValue } from "../json-value.js";
import type { ArtifactIndex } from "./artifact-index.js";

export type ArtifactFormat = "json" | "text" | "markdown" | "bytes";

export type ArtifactIndexInput = Partial<
  Omit<ArtifactIndex, "hash" | "time">
> & {
  time?: string;
};

export type ArtifactPutInput =
  | {
      format: "json";
      value: JsonValue;
      index?: ArtifactIndexInput;
    }
  | {
      format: "text";
      value: string;
      index?: ArtifactIndexInput;
    }
  | {
      format: "markdown";
      value: string;
      index?: ArtifactIndexInput;
    }
  | {
      format: "bytes";
      value: Uint8Array;
      index?: ArtifactIndexInput;
    };
