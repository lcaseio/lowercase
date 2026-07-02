import type { Result } from "../../result.type.js";
import type { SimDefinition } from "../../db-sql/sim-record.js";

export type GetSimSpecReq = {
  simId: string;
};
export type GetSimSpecRes = Result<SimDefinition, string>;
