import type { RunListItem } from "../../run-index-store/run-list.js";

export type GetRunsReq = {
  flowVersionId?: string;
};

export type GetRunsRes =
  | { ok: true; runList: RunListItem[] }
  | { ok: false; error: string };
