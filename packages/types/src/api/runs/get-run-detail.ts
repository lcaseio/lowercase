import type { RunDetail } from "../../db-sql/run-record.js";

export type GetRunDetailReq = { runId: string };
export type GetRunDetailRes =
  | {
      ok: true;
      value: RunDetail;
    }
  | { ok: false; error: string };
