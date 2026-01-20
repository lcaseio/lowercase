import type { StepHttpJson } from "../../../flow/http-json.step.js";
import type { JobSubmittedData } from "../data.js";

export type JobHttpJsonData = Omit<StepHttpJson, "type" | "on" | "tool">;
export type JobHttpJsonSubmittedData = JobHttpJsonData & JobSubmittedData;
export type JobHttpJsonQueuedData = JobHttpJsonData & JobSubmittedData;
