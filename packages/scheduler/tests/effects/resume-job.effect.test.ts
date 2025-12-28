import { describe, it, expect, vi } from "vitest";
import { resumeJobEffect } from "../../src/effects/resume-job.effect.js";
import type { ResumeJobFx } from "../../src/rm.types.js";
import type {
  EmitErrorFn,
  RmEffectDeps,
} from "../../src/registries/effect.registry.js";
import { jobFinishedMsg } from "../fixtures/job-finished/message.js";
import type { AnyEvent, JobResumedEvent } from "@lcase/types";
import type {
  EmitterFactoryPort,
  JobParserPort,
  QueuePort,
} from "@lcase/ports";

describe("resumeJobEffect", () => {
  it("does the correct stuff", async () => {
    const delayedJobEvent: AnyEvent<"job.httpjson.delayed"> = {
      type: "job.httpjson.delayed",
      data: {
        job: {
          id: "",
          capid: "httpjson",
          toolid: jobFinishedMsg.event.data.job.toolid,
        },
        url: "",
      },
      domain: "job",
      flowid: "test-flowid",
      id: "test-id",
      jobid: "test-jobid",
      runid: "test-runid",
      source: "test-source",
      spanid: "test-spanid",
      specversion: "1.0",
      stepid: "test-stepid",
      time: "test-time",
      toolid: "test-toolid",
      traceid: "test-traceid",
      traceparent: "test-traceparent",
      action: "delayed",
      capid: "httpjson",
    };

    const resumeJobFx: ResumeJobFx = {
      type: "ResumeJob",
      event: jobFinishedMsg.event,
    };

    const e = delayedJobEvent as unknown as JobResumedEvent;
    e.type = `job.${delayedJobEvent.capid}.resumed`;
    e.toolid = delayedJobEvent.data.job.toolid;
    e.data.job.toolid = delayedJobEvent.data.job.toolid;
    e.action = "resumed";

    const parseJobResumed = vi.fn(() => e);
    const parseJobDelayed = vi.fn(() => {
      return {
        type: delayedJobEvent.type,
        event: delayedJobEvent,
      };
    });
    const jobParser = {
      parseJobResumed,
      parseJobDelayed,
    } as unknown as JobParserPort;

    const emit = vi.fn(() => e);
    const formEvent = vi.fn(() => e);
    const emitFormedEvent = vi.fn(() => e);
    const newJobEmitterFromEvent = vi.fn(() => {
      return { emit, formEvent, emitFormedEvent };
    });

    const ef = { newJobEmitterFromEvent } as unknown as EmitterFactoryPort;

    const enqueue = vi.fn(() => {});
    const dequeue = vi.fn(() => delayedJobEvent);
    const queue = {
      enqueue,
      dequeue,
    } as unknown as QueuePort;

    const emitErrorFn = {} as EmitErrorFn;

    const deps: RmEffectDeps = {
      ef,
      jobParser,
      queue,
      emitErrorFn,
    };

    await resumeJobEffect(resumeJobFx, deps);

    expect(parseJobDelayed).toHaveBeenCalledExactlyOnceWith(delayedJobEvent);
    expect(parseJobResumed).toHaveBeenCalledExactlyOnceWith(e);
    expect(emit).toHaveBeenCalledExactlyOnceWith(e.type, e.data);
  });
});
