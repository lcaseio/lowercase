// api/runner/requests
export type PostRunsReq = {
  flowDefHash: string;
  forkSpecHash?: string;
};

export type PostRunsRes = { ok: true } | { ok: false; error: string };
