import type { ConcurrencyEventType } from "@lcase/types";
import { ZodSchema } from "zod";
import {
  ConcurrencyStartedSchema,
  ConcurrencyStoppedSchema,
  ConcurrencyToolDeniedSchema,
  ConcurrencyToolGrantedSchema,
} from "../../schemas/concurrency.event.schema.js";
import {
  ConcurrencyStartedDataSchema,
  ConcurrencyToolDeniedDataSchema,
  ConcurrencyToolGrantedDataSchema,
} from "../../schemas/concurrency.data.schema.js";

type ConcurrencySchemaMap = Record<
  ConcurrencyEventType,
  { schema: { event: ZodSchema; data: ZodSchema } }
>;
export const concurrencySchemaMap: ConcurrencySchemaMap = {
  "concurrency.tool.denied": {
    schema: {
      event: ConcurrencyToolDeniedSchema,
      data: ConcurrencyToolDeniedDataSchema,
    },
  },
  "concurrency.tool.granted": {
    schema: {
      event: ConcurrencyToolGrantedSchema,
      data: ConcurrencyToolGrantedDataSchema,
    },
  },
  "concurrency.started": {
    schema: {
      event: ConcurrencyStartedSchema,
      data: ConcurrencyStartedDataSchema,
    },
  },
  "concurrency.stopped": {
    schema: {
      event: ConcurrencyStoppedSchema,
      data: ConcurrencyStartedDataSchema,
    },
  },
};
