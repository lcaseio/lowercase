import type { DomainEntityActionDescriptor } from "../../shared/otel-attributes.js";
import type { JobCompletedData, JobFailedData } from "../data.js";
import type {
  JobHttpJsonData,
  JobHttpJsonQueuedData,
  JobHttpJsonSubmittedData,
} from "./data.js";

export type JobHttpJsonEventMap = {
  "job.httpjson.submitted": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "submitted",
    JobHttpJsonSubmittedData
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
    JobHttpJsonQueuedData
  >;
  "job.httpjson.resumed": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "resumed",
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
