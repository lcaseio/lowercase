import type { Result } from "../../result.type.js";
import type { SimListItem } from "../../db-sql/sim-record.js";

export type GetSimsReq = { flowVersionId?: string };
export type GetSimsRes = Result<SimListItem[], string>;
