import { StepHttpJson } from "../../../flow/http-json.step.js";
import { PipeDataObject } from "../../shared/pipe.js";
import { JobDescriptorResolved } from "../data.js";

export type JobHttpJsonData = Omit<StepHttpJson, "pipe" | "type">;

export type JobHttpJsonResolvedData = JobDescriptorResolved &
  Omit<StepHttpJson, "pipe" | "type"> &
  PipeDataObject;

export type JobHttpJsonDelayedData = JobHttpJsonData; // later add delayed object
