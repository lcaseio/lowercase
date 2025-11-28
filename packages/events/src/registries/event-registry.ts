import type { ZodSchema } from "zod";
import type { EventType } from "@lcase/types";
import {
  FlowCompletedSchema,
  FlowQueuedSchema,
  FlowStartedSchema,
} from "../schemas/flow-event.schema.js";
import {
  FlowCompletedDataSchema,
  FlowQueuedDataSchema,
  FlowStartedDataSchema,
} from "../schemas/flow-data.schema.js";
import {
  EngineStartedSchema,
  EngineStoppedSchema,
} from "../schemas/engine.event.schema.js";
import {
  EngineStartedDataSchema,
  EngineStoppedDataSchema,
} from "../schemas/engine.data.schema.js";
import {
  RunCompletedSchema,
  RunStartedSchema,
} from "../schemas/run.event.schema.js";
import {
  RunCompletedDataSchema,
  RunStartedDataSchema,
} from "../schemas/run.data.schema.js";
import {
  StepCompletedSchema,
  StepStartedSchema,
} from "../schemas/step.event.schema.js";
import {
  StepCompletedDataSchema,
  StepStartedDataSchema,
} from "../schemas/step.data.schema.js";
import {
  JobMcpQueuedSchema,
  JobMcpSchema,
} from "../schemas/job/job.event.schema.js";
import {
  JobMcpDataSchema,
  JobMcpResolvedDataSchema,
} from "../schemas/job/job.data.schema.js";
import {
  ToolCompletedSchema,
  ToolFailedSchema,
  ToolStartedSchema,
} from "../schemas/tool.event.schema.js";
import {
  ToolCompletedDataSchema,
  ToolFailedDataSchema,
  ToolStartedDataSchema,
} from "../schemas/tool.data.schema.js";
import {
  WorkerRegisteredDataSchema,
  WorkerRegistrationRequestedDataSchema,
  WorkerStartedDataSchema,
  WorkerStoppedDataSchema,
} from "../schemas/worker.data.schema.js";
import {
  WorkerRegisteredSchema,
  WorkerRegistrationRequestedSchema,
  WorkerStartedSchema,
  WorkerStoppedSchema,
} from "../schemas/worker.event.schema.js";
import { SystemLoggedSchema } from "../schemas/system.event.schema.js";
import { SystemLoggedDataSchema } from "../schemas/system.data.schema.js";
import { httpjsonRegistry } from "./job/httpjson.registry.js";

export type EventTopic =
  | "steps.lifecycle"
  | "flows.lifecycle"
  | "workers.lifecycle"
  | "worker.registration.requested"
  | "engines.lifecycle"
  | "runs.lifecycle"
  | "jobs.lifecycle"
  | "job.requested"
  | "job.httpjson.submitted"
  | "job.httpjson.queued"
  | "job.mcp.submitted"
  | "tools.lifecycle"
  | "system";

// simple hardcoded registry mapping event types to schemas, as well as
// topics to publish the event to
export const eventRegistry = {
  ...httpjsonRegistry,
  "flow.queued": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowQueuedSchema,
      data: FlowQueuedDataSchema,
    },
  },
  "flow.started": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowStartedSchema,
      data: FlowStartedDataSchema,
    },
  },
  "flow.completed": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowCompletedSchema,
      data: FlowCompletedDataSchema,
    },
  },
  "engine.started": {
    topic: "engines.lifecycle",
    schema: {
      event: EngineStartedSchema,
      data: EngineStartedDataSchema,
    },
  },
  "engine.stopped": {
    topic: "engines.lifecycle",
    schema: {
      event: EngineStoppedSchema,
      data: EngineStoppedDataSchema,
    },
  },
  "run.started": {
    topic: "runs.lifecycle",
    schema: {
      event: RunStartedSchema,
      data: RunStartedDataSchema,
    },
  },
  "run.completed": {
    topic: "runs.lifecycle",
    schema: {
      event: RunCompletedSchema,
      data: RunCompletedDataSchema,
    },
  },
  "step.started": {
    topic: "steps.lifecycle",
    schema: {
      event: StepStartedSchema,
      data: StepStartedDataSchema,
    },
  },
  "step.completed": {
    topic: "steps.lifecycle",
    schema: {
      event: StepCompletedSchema,
      data: StepCompletedDataSchema,
    },
  },
  "step.failed": {
    topic: "steps.lifecycle",
    schema: {
      event: StepCompletedSchema,
      data: StepCompletedDataSchema,
    },
  },
  "job.mcp.submitted": {
    topic: "job.mcp.submitted",
    schema: {
      event: JobMcpSchema,
      data: JobMcpDataSchema,
    },
  },
  "job.mcp.queued": {
    topic: "jobs.lifecycle",
    schema: {
      event: JobMcpQueuedSchema,
      data: JobMcpResolvedDataSchema,
    },
  },
  "tool.started": {
    topic: "tools.lifecycle",
    schema: {
      event: ToolStartedSchema,
      data: ToolStartedDataSchema,
    },
  },
  "tool.completed": {
    topic: "tools.lifecycle",
    schema: {
      event: ToolCompletedSchema,
      data: ToolCompletedDataSchema,
    },
  },
  "tool.failed": {
    topic: "tools.lifecycle",
    schema: {
      event: ToolFailedSchema,
      data: ToolFailedDataSchema,
    },
  },
  "worker.started": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerStartedSchema,
      data: WorkerStartedDataSchema,
    },
  },
  "worker.stopped": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerStoppedSchema,
      data: WorkerStoppedDataSchema,
    },
  },
  "worker.registered": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerRegisteredSchema,
      data: WorkerRegisteredDataSchema,
    },
  },
  "worker.registration.requested": {
    topic: "worker.registration.requested",
    schema: {
      event: WorkerRegistrationRequestedSchema,
      data: WorkerRegistrationRequestedDataSchema,
    },
  },
  "system.logged": {
    topic: "system",
    schema: {
      event: SystemLoggedSchema,
      data: SystemLoggedDataSchema,
    },
  },
} satisfies Record<
  EventType,
  { topic?: EventTopic; schema: { event: ZodSchema; data: ZodSchema } }
>;

export type EventSchemaRegistry = Record<
  EventType,
  { topic?: EventTopic; schema: { event: ZodSchema; data: ZodSchema } }
>;
