// POST api/runs  request
export type PostRunsReq = {
  flowId: string;
  flowVersionId: string;
  flowDefHash: string;
  simId?: string;
  forkSpecHash?: string;
  params?: Record<string, string>;
};

export type PostRunsRes =
  | { ok: true; runId: string }
  | { ok: false; error: string };
