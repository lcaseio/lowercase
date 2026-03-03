import { JsonValue } from "../../json-value.js";

export type GetArtifactReq = { hash: string };
export type GetArtifactRes =
  | {
      ok: true;
      jsonValue: JsonValue;
    }
  | { ok: false; error: string };
