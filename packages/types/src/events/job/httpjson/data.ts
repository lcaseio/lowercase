import { StepHttpJson } from "../../../flow/http-json.step.js";

export type JobHttpJsonData = Omit<StepHttpJson, "type" | "on" | "tool">;
