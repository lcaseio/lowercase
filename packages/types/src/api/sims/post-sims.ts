import type { Result } from "../../result.type.js";
import type { SimRecord } from "../../db-sql/sim-record.js";

export type PostSimsReq = {
  name: string;
  flowId: string;
  flowVersionId: string;
  parentRunId: string;
  reuse: string[];
  description?: string;
};

export type PostSimsRes = Result<SimRecord, string>;
