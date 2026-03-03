// POST api/runs  request
export type PostRunsReq = {
  flowDefHash: string;
  forkSpecHash?: string;
};

export type PostRunsRes =
  | { ok: true; runId: string }
  | { ok: false; error: string };
