import type { RunIndex } from "../../engine/run-index.js";

export type GetRunIndexReq = { runId: string };
export type GetRunIndexRes =
  | {
      ok: true;
      index: RunIndex;
    }
  | { ok: false; error: string };
