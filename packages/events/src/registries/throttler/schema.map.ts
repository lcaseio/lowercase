import type { ThrottlerEventType } from "@lcase/types";
import { ZodSchema } from "zod";
import {
  ThrottlerStartedSchema,
  ThrottlerStoppedSchema,
  ThrottlerToolDeniedSchema,
  ThrottlerToolGrantedSchema,
} from "../../schemas/throttler.event.schema.js";
import {
  ThrottlerStartedDataSchema,
  ThrottlerToolDeniedDataSchema,
  ThrottlerToolGrantedDataSchema,
} from "../../schemas/throttler.data.schema.js";

type CSchemaMap = Record<
  ThrottlerEventType,
  { schema: { event: ZodSchema; data: ZodSchema } }
>;
export const throttlerSchemaMap: ThrottlerSchemaMap = {
  "throttler.tool.denied": {
    schema: {
      event: ThrottlerToolDeniedSchema,
      data: ThrottlerToolDeniedDataSchema,
    },
  },
  "throttler.tool.granted": {
    schema: {
      event: ThrottlerToolGrantedSchema,
      data: ThrottlerToolGrantedDataSchema,
    },
  },
  "throttler.started": {
    schema: {
      event: ThrottlerStartedSchema,
      data: ThrottlerStartedDataSchema,
    },
  },
  "throttler.stopped": {
    schema: {
      event: ThrottlerStoppedSchema,
      data: ThrottlerStartedDataSchema,
    },
  },
};
