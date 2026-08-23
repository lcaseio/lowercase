import type { RunParamManifest } from "../../db-sql/run-record.js";

export type GetRunParamsReq = { runId: string };
export type GetRunParamsRes =
  | {
      ok: true;
      value: RunParamManifest;
    }
  | { ok: false; error: string };
