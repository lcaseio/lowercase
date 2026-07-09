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
