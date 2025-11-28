import { StepHttpJson } from "../../../flow/http-json.step.js";
import { PipeDataObject } from "../../shared/pipe.js";
import { JobDescriptor, JobDescriptorResolved } from "../data.js";

export type JobHttpJsonData = JobDescriptor &
  Omit<StepHttpJson, "pipe" | "type"> &
  PipeDataObject;

export type JobHttpJsonResolvedData = JobDescriptorResolved &
  Omit<StepHttpJson, "pipe" | "type"> &
  PipeDataObject;

export type JobHttpJsonDelayedData = JobHttpJsonData; // later add delayed object
