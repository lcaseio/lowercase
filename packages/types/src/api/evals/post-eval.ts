// POST api/evals  request
export type PostEvalsReqTarget = {
  runId: string;
  stepId: string;
  exportName: string;
  paramName: string;
};

export type PostEvalsReq = {
  targets: PostEvalsReqTarget[];
  evalFlowId: string;
  evalFlowVersionId: string;
  evalFlowDefHash: string;
  judgeSystemPromptHash: string;
  experimentId?: string;
};

export type PostEvalsRes =
  { ok: true; evalRunId: string } | { ok: false; error: string };
