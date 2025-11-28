import { AnyEvent, JobEvent, JobEventType } from "@lcase/types";
import {
  jobCompletedTypeSchema,
  jobFailedTypeSchema,
  jobQueuedTypeSchema,
  jobSubmittedTypeSchema,
} from "../schemas/job/job.category.schema.js";
import {
  JobCompletedParsed,
  JobFailedParsed,
  JobParserPort,
  JobQueuedParsed,
  JobSubmittedParsed,
} from "@lcase/ports";
import { EventSchemaRegistry } from "../registries/event-registry.js";

export class JobParser implements JobParserPort {
  constructor(private readonly eventRegistry: EventSchemaRegistry) {}

  parseJobSubmitted(event: AnyEvent): JobSubmittedParsed | undefined {
    const type = jobSubmittedTypeSchema.safeParse(event.type);
    if (type.error) {
      return;
    }
    const parsedEvent = this.parseJobEvent(event as JobEvent<typeof type.data>);
    if (!parsedEvent) return;
    const capId = this.#getCapId(type.data);
    return {
      type: type.data,
      capId,
      event: parsedEvent,
    };
  }

  parseJobQueued(event: AnyEvent): JobQueuedParsed | undefined {
    const type = jobQueuedTypeSchema.safeParse(event.type);
    if (type.error) {
      return;
    }
    const parsedEvent = this.parseJobEvent(event as JobEvent<typeof type.data>);
    if (!parsedEvent) return;
    const capId = this.#getCapId(type.data);
    return {
      type: type.data,
      capId,
      event: parsedEvent,
    };
  }

  #getCapId(type: JobEventType) {
    const parts = type.split(".");
    return parts[1];
  }
  parseJobCompleted(event: AnyEvent): JobCompletedParsed | undefined {
    const type = jobCompletedTypeSchema.safeParse(event.type);
    if (type.error) {
      return;
    }
    const parsedEvent = this.parseJobEvent(event as JobEvent<typeof type.data>);
    if (!parsedEvent) return;
    const capId = this.#getCapId(type.data);
    return {
      type: type.data,
      capId,
      event: parsedEvent,
    };
  }

  parseJobFailed(event: AnyEvent): JobFailedParsed | undefined {
    const type = jobFailedTypeSchema.safeParse(event.type);
    if (type.error) {
      return;
    }
    const parsedEvent = this.parseJobEvent(event as JobEvent<typeof type.data>);
    if (!parsedEvent) return;
    const capId = this.#getCapId(type.data);
    return {
      type: type.data,
      capId,
      event: parsedEvent,
    };
  }

  parseJobEvent<T extends JobEventType>(
    event: JobEvent<T>
  ): JobEvent<T> | undefined {
    const schema = this.eventRegistry[event.type].schema.event;
    const parsedEvent = schema.safeParse(event);
    if (parsedEvent.error) {
      return;
    }
    return parsedEvent.data;
  }
}
