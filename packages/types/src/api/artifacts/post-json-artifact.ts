import type { JsonValue } from "../../json-value.js";
import type { Result } from "../../result.type.js";

export type PostJsonArtifactReq = {
  body: JsonValue;
};

export type PostJsonArtifactRes = Result<string, string>;
