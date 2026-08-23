import type { JsonValue } from "../json-value.js";
import type { ArtifactIndex } from "./artifact-index.js";

export type ArtifactFormat = "json" | "text" | "markdown" | "bytes";

// deliberately excludes flowId/flowVersionId/curated -- those are
// curation-only, settable only through a dedicated association path, never
// through a content put (see docs/adr/0002-artifact-flow-association-schema.md,
// docs/adr/0003-artifact-curated-flag.md)
export type ArtifactIndexInput = Partial<
  Omit<ArtifactIndex, "hash" | "time" | "flowId" | "flowVersionId" | "curated">
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
