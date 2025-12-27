import { JobHttpJsonEventType } from "@lcase/types";
import {
  JobHttpJsonCompletedSchema,
  JobHttpJsonDelayedSchema,
  JobHttpJsonFailedSchema,
  JobHttpJsonQueuedSchema,
  JobHttpJsonResumedSchema,
  JobHttpJsonStartedSchema,
  JobHttpJsonSubmittedSchema,
} from "../../schemas/job/httpjson/httpjson.event.schema.js";
import {
  JobCompletedDataSchema,
  JobFailedDataSchema,
  JobHttpJsonDataSchema,
  JobHttpJsonResolvedDataSchema,
} from "../../schemas/job/job.data.schema.js";
import { ZodSchema } from "zod";

export const httpjsonRegistry = {
  "job.httpjson.submitted": {
    schema: {
      event: JobHttpJsonSubmittedSchema,
      data: JobHttpJsonDataSchema,
    },
  },
  "job.httpjson.delayed": {
    schema: {
      event: JobHttpJsonDelayedSchema,
      data: JobHttpJsonResolvedDataSchema,
    },
  },
  "job.httpjson.resumed": {
    schema: {
      event: JobHttpJsonResumedSchema,
      data: JobHttpJsonResolvedDataSchema,
    },
  },
  "job.httpjson.queued": {
    schema: {
      event: JobHttpJsonQueuedSchema,
      data: JobHttpJsonResolvedDataSchema,
    },
  },

  "job.httpjson.started": {
    schema: {
      event: JobHttpJsonStartedSchema,
      data: JobHttpJsonResolvedDataSchema,
    },
  },
  "job.httpjson.completed": {
    schema: {
      event: JobHttpJsonCompletedSchema,
      data: JobCompletedDataSchema,
    },
  },
  "job.httpjson.failed": {
    schema: {
      event: JobHttpJsonFailedSchema,
      data: JobFailedDataSchema,
    },
  },
} satisfies Record<
  JobHttpJsonEventType,
  { schema: { event: ZodSchema; data: ZodSchema } }
>;
