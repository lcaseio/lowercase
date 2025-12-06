import { StepHttpJson } from "./http-json.step.js";
import { StepMcp } from "./mcp.step.js";
import { StepParallel } from "./parallel.step.js";

export type StepDefinition = StepMcp | StepHttpJson | StepParallel;
