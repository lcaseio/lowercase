export type EvalScorePayload = {
  overall: number;
  passed: boolean;
  dimensions: Record<string, { score: number; rationale?: string }>;
  rationale?: string;
};

export type EvalResultRecord = {
  id: string;
  targetRunId: string;
  targetStepId?: string;
  targetExportName?: string;
  // only populated when the record was fetched via a query that joins the
  // target run (e.g. listByTargetShape) -- not stored on EvalResult itself
  targetFlowVersionId?: string;
  evalRunId: string;
  evalFlowId?: string;
  evalFlowVersionId?: string;
  experimentId?: string;
  overall: number;
  passed: boolean;
  payload: EvalScorePayload;
  createdAt: string;
};

export type CreateEvalResultInput = {
  targetRunId: string;
  targetStepId?: string;
  targetExportName?: string;
  evalRunId: string;
  evalFlowId?: string;
  evalFlowVersionId?: string;
  experimentId?: string;
  overall: number;
  passed: boolean;
  payload: EvalScorePayload;
};
