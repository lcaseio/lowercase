import { DomainEntityActionDescriptor } from "../../shared/otel-attributes.js";
import { JobCompletedData, JobFailedData } from "../data.js";
import { JobHttpJsonData, JobHttpJsonResolvedData } from "./data.js";

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
    JobHttpJsonResolvedData
  >;
  "job.httpjson.queued": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "queued",
    JobHttpJsonResolvedData
  >;
  "job.httpjson.started": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "started",
    JobHttpJsonResolvedData
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
