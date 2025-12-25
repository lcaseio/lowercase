import { describe, it, expect, vi } from "vitest";
import {
  EmitErrorFn,
  RmEffectDeps,
  wireEffectHandlers,
} from "../../src/registries/effect.registry.js";
import { EmitterFactoryPort, JobParserPort, QueuePort } from "@lcase/ports";
import { DelayJobFx, QueueJobFx } from "../../src/rm.types.js";
import { jobSubmittedHttpJsonMsg } from "../fixtures/job-submitted.msg.js";
import { JobDelayedEvent, JobQueuedEvent } from "@lcase/types";
import { delayJobEffect } from "../../src/effects/delay-job.effect.js";

describe("delayJobEffect", () => {
  it("emits and queues the correct event when parsing succeeds", async () => {
    const delayJobFx = {
      type: "DelayJob",
      toolId: "httpjson",
      event: jobSubmittedHttpJsonMsg.event,
    } satisfies DelayJobFx;

    const e = jobSubmittedHttpJsonMsg.event as unknown as JobDelayedEvent;
    e.type = `job.${jobSubmittedHttpJsonMsg.event.capid}.delayed`;
    e.toolid = delayJobFx.toolId;
    e.data.job.toolid = delayJobFx.toolId;
    e.action = "delayed";

    const parseJobDelayed = vi.fn(() => {
      return { type: e.type, event: { data: e.data } };
    });
    const jobParser = { parseJobDelayed } as unknown as JobParserPort;

    const formEvent = vi.fn(() => e);
    const emitFormedEvent = vi.fn(() => e);
    const newJobEmitterFromEvent = vi.fn(() => {
      return { formEvent, emitFormedEvent };
    });
    const ef = { newJobEmitterFromEvent } as unknown as EmitterFactoryPort;

    const enqueue = vi.fn(() => {});
    const queue = {
      enqueue,
    } as unknown as QueuePort;

    const emitErrorFn = {} as EmitErrorFn;

    const deps: RmEffectDeps = { queue, ef, emitErrorFn, jobParser };

    await delayJobEffect(delayJobFx, deps);

    expect(parseJobDelayed).toHaveBeenCalledExactlyOnceWith(e);
    expect(newJobEmitterFromEvent).toHaveBeenCalledExactlyOnceWith(
      e,
      "lowercase://rm"
    );
    expect(enqueue).toHaveBeenCalledWith(delayJobFx.toolId + "-delayed", e);
    expect(emitFormedEvent).toHaveBeenCalledWith(e);
  });

  it("emits failure event when parsing fails", async () => {
    const delayJobFx = {
      type: "DelayJob",
      toolId: "httpjson",
      event: jobSubmittedHttpJsonMsg.event,
    } satisfies DelayJobFx;

    const e = jobSubmittedHttpJsonMsg.event as unknown as JobDelayedEvent;
    e.type = `job.${jobSubmittedHttpJsonMsg.event.capid}.delayed`;
    e.toolid = delayJobFx.toolId;
    e.data.job.toolid = delayJobFx.toolId;
    e.action = "delayed";

    const parseJobDelayed = vi.fn().mockReturnValue(undefined);
    const jobParser = { parseJobDelayed } as unknown as JobParserPort;

    const ef = {} as unknown as EmitterFactoryPort;
    const queue = {} as unknown as QueuePort;

    const emitErrorFn = vi
      .fn()
      .mockReturnValue(undefined) as unknown as EmitErrorFn;
    const deps: RmEffectDeps = { queue, ef, emitErrorFn, jobParser };

    await delayJobEffect(delayJobFx, deps);

    expect(parseJobDelayed).toHaveBeenCalledExactlyOnceWith(e);
    expect(emitErrorFn).toHaveBeenCalledExactlyOnceWith(
      jobSubmittedHttpJsonMsg.event,
      ef,
      `Error delaying event ${e.type}`
    );
  });
});
