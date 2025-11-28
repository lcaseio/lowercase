import { DomainEntityActionDescriptor } from "../../shared/otel-attributes.js";
import { JobCompletedData, JobFailedData } from "../data.js";
import { JobHttpJsonData } from "./data.js";

export type JobHttpJsonEventMap = {
  "job.httpjson.submitted": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "submitted",
    JobHttpJsonData
  >;
  "job.httpjson.delayed": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "delayed",
    JobHttpJsonData
  >;
  "job.httpjson.queued": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "queued",
    JobHttpJsonData
  >;
  "job.httpjson.started": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "started",
    JobHttpJsonData
  >;
  "job.httpjson.completed": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "completed",
    JobCompletedData
  >;
  "job.httpjson.failed": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "failed",
    JobFailedData
  >;
};

export type JobHttpJsonEventType = keyof JobHttpJsonEventMap;
