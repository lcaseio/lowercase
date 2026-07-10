import type { EvalResultRecord } from "../../db-sql/eval-result-record.js";
import type { Result } from "../../result.type.js";

// GET api/evals?flowId=...&stepId=...&exportName=...
// GET api/evals?experimentId=...
export type GetEvalsReq = {
  flowId?: string;
  stepId?: string;
  exportName?: string;
  experimentId?: string;
};

export type GetEvalsRes = Result<EvalResultRecord[], string>;
