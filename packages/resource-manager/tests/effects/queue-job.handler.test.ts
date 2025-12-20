import { describe, it, expect, vi } from "vitest";
import {
  EmitErrorFn,
  wireEffectHandlers,
} from "../../src/registries/effect.registry.js";
import { EmitterFactoryPort, JobParserPort, QueuePort } from "@lcase/ports";
import { QueueJobFx } from "../../src/rm.types.js";
import { jobSubmittedHttpJsonMsg } from "../fixtures/job-submitted.msg.js";
import { JobQueuedEvent } from "@lcase/types";

describe("QueueJob Effect Handler", () => {
  it("emits and queues the correct event when parsing succeeds", async () => {
    const queueJobFx = {
      type: "QueueJob",
      toolId: "httpjson",
      event: jobSubmittedHttpJsonMsg.event,
    } satisfies QueueJobFx;

    const e = jobSubmittedHttpJsonMsg.event as unknown as JobQueuedEvent;
    e.type = `job.${jobSubmittedHttpJsonMsg.event.capid}.queued`;
    e.toolid = queueJobFx.toolId;
    e.data.job.toolid = queueJobFx.toolId;
    e.action = "queued";

    const parseJobQueued = vi.fn(() => {
      return { type: e.type, event: { data: e.data } };
    });
    const jobParser = { parseJobQueued } as unknown as JobParserPort;

    const emit = vi.fn(() => e);
    const newJobEmitterFromEvent = vi.fn(() => {
      return { emit };
    });
    const ef = { newJobEmitterFromEvent } as unknown as EmitterFactoryPort;

    const enqueue = vi.fn(() => {});
    const queue = {
      enqueue,
    } as unknown as QueuePort;

    const emitErrorFn = {} as EmitErrorFn;

    const handlers = wireEffectHandlers({ ef, jobParser, queue, emitErrorFn });
    const handler = handlers.QueueJob;

    await handler(queueJobFx);

    expect(parseJobQueued).toHaveBeenCalledExactlyOnceWith(e);
    expect(newJobEmitterFromEvent).toHaveBeenCalledExactlyOnceWith(
      e,
      "lowercase://rm"
    );
    expect(enqueue).toHaveBeenCalledWith(queueJobFx.toolId, e);
  });

  it("emits failure event when parsing fails", async () => {
    const queueJobFx = {
      type: "QueueJob",
      toolId: "httpjson",
      event: jobSubmittedHttpJsonMsg.event,
    } satisfies QueueJobFx;

    const e = jobSubmittedHttpJsonMsg.event as unknown as JobQueuedEvent;
    e.type = `job.${jobSubmittedHttpJsonMsg.event.capid}.queued`;
    e.toolid = queueJobFx.toolId;
    e.data.job.toolid = queueJobFx.toolId;
    e.action = "queued";

    const parseJobQueued = vi.fn().mockReturnValue(undefined);
    const jobParser = { parseJobQueued } as unknown as JobParserPort;

    const ef = {} as unknown as EmitterFactoryPort;
    const queue = {} as unknown as QueuePort;

    const emitErrorFn = vi
      .fn()
      .mockReturnValue(undefined) as unknown as EmitErrorFn;
    const handlers = wireEffectHandlers({ ef, jobParser, queue, emitErrorFn });
    const handler = handlers.QueueJob;

    await handler(queueJobFx);

    expect(parseJobQueued).toHaveBeenCalledExactlyOnceWith(e);
    expect(emitErrorFn).toHaveBeenCalledExactlyOnceWith(
      jobSubmittedHttpJsonMsg.event,
      ef,
      `Error queueing event ${e.type}`
    );
  });
});
