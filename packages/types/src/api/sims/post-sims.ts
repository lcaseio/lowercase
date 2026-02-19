// POST api/sims  request
export type PostSimsReq = {
  flowDefHash: string;
  parentRunId: string;
  reuse: string[];
};

export type PostSimsRes =
  | { ok: true; forkSpecHash: string }
  | { ok: false; error: string };
