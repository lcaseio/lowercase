import { StepHttpJson } from "./http-json.step.js";
import { StepMcp } from "./mcp.step.js";

export type CapMap = {
  mcp: StepMcp;
  httpjson: StepHttpJson;
};

export type CapId = keyof CapMap;
