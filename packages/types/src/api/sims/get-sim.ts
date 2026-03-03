import type { ForkSpec } from "../../engine/fork-spec.type.js";

export type GetSimSpecReq = {
  hash: string;
};
export type GetSimSpecRes =
  | {
      ok: true;
      spec: ForkSpec;
    }
  | { ok: false; error: string };
