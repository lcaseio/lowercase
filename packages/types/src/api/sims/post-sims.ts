// POST api/sims  request
export type PostSimsReq = {
  name: string;
  flowDefHash: string;
  parentRunId: string;
  reuse: string[];
  description?: string;
};

export type PostSimsRes =
  | { ok: true; forkSpecHash: string }
  | { ok: false; error: string };
