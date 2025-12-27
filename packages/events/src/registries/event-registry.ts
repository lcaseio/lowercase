import type { z, ZodSchema } from "zod";
import type { EventType } from "@lcase/types";
import {
  FlowCompletedSchema,
  FlowFailedSchema,
  FlowQueuedSchema,
  FlowStartedSchema,
  FlowSubmittedSchema,
} from "../schemas/flow-event.schema.js";
import {
  FlowCompletedDataSchema,
  FlowFailedDataSchema,
  FlowQueuedDataSchema,
  FlowStartedDataSchema,
  FlowSubmittedDataSchema,
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
  RunFailedSchema,
  RunStartedSchema,
} from "../schemas/run.event.schema.js";
import {
  RunCompletedDataSchema,
  RunFailedDataSchema,
  RunStartedDataSchema,
} from "../schemas/run.data.schema.js";
import {
  StepCompletedSchema,
  StepFailedSchema,
  StepStartedSchema,
} from "../schemas/step.event.schema.js";
import {
  StepCompletedDataSchema,
  StepFailedDataSchema,
  StepStartedDataSchema,
} from "../schemas/step.data.schema.js";
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
  WorkerJobDequeuedDataSchema,
  WorkerProfileAddedDataSchema,
  WorkerProfileSubmittedDataSchema,
  WorkerStartedDataSchema,
  WorkerStoppedDataSchema,
} from "../schemas/worker.data.schema.js";
import {
  WorkerJobDequeuedSchema,
  WorkerProfileAddedSchema,
  WorkerProfileSubmittedSchema,
  WorkerStartedSchema,
  WorkerStoppedSchema,
} from "../schemas/worker.event.schema.js";
import { SystemLoggedSchema } from "../schemas/system.event.schema.js";
import { SystemLoggedDataSchema } from "../schemas/system.data.schema.js";
import { httpjsonRegistry } from "./job/httpjson.registry.js";
import { mcpRegistry } from "./job/mcp.registry.js";
import { replayRegistry } from "./replay/replay.registry.js";

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
  ...mcpRegistry,
  ...replayRegistry,
  "flow.queued": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowQueuedSchema,
      data: FlowQueuedDataSchema,
    },
  },
  "flow.submitted": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowSubmittedSchema,
      data: FlowSubmittedDataSchema,
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
  "flow.failed": {
    topic: "flows.lifecycle",
    schema: {
      event: FlowFailedSchema,
      data: FlowFailedDataSchema,
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
  "run.failed": {
    topic: "runs.lifecycle",
    schema: {
      event: RunFailedSchema,
      data: RunFailedDataSchema,
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
      event: StepFailedSchema,
      data: StepFailedDataSchema,
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
  "worker.profile.added": {
    topic: "workers.lifecycle",
    schema: {
      event: WorkerProfileAddedSchema,
      data: WorkerProfileAddedDataSchema,
    },
  },
  "worker.profile.submitted": {
    schema: {
      event: WorkerProfileSubmittedSchema,
      data: WorkerProfileSubmittedDataSchema,
    },
  },
  "worker.job.dequeued": {
    schema: {
      event: WorkerJobDequeuedSchema,
      data: WorkerJobDequeuedDataSchema,
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
  { topic?: EventTopic; schema: { event: z.ZodSchema; data: z.ZodSchema } }
>;

export type EventSchemaRegistry = Record<
  EventType,
  { topic?: EventTopic; schema: { event: z.ZodSchema; data: z.ZodSchema } }
>;
