import { StepHttpJson } from "../../../flow/http-json.step.js";
import { PipeDataObject } from "../../shared/pipe.js";
import { JobDelayedData, JobDescriptor } from "../data.js";

export type JobHttpJsonData = JobDescriptor &
  Omit<StepHttpJson, "pipe" | "type"> &
  PipeDataObject;

export type JobHttpJsonDelayedData = JobHttpJsonData & JobDelayedData;
