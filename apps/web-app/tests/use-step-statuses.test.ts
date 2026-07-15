import { describe, expect, it } from "vitest";
import type { AnyEvent } from "@lcase/types";
import { deriveStepStatuses } from "@/hooks/use-step-statuses";

function makeEvent(overrides: Partial<AnyEvent> & { type: string }): AnyEvent {
  return {
    id: "evt-1",
    source: "test",
    specversion: "1.0",
    time: new Date().toISOString(),
    ...overrides,
  } as unknown as AnyEvent;
}

describe("deriveStepStatuses", () => {
  it("marks all steps pending when there are no events", () => {
    expect(deriveStepStatuses([], ["one", "two"])).toEqual({
      one: "pending",
      two: "pending",
    });
  });

  it("marks a step running once step.started fires", () => {
    const events = [
      makeEvent({ type: "step.started", stepid: "one", data: { status: "started" } } as never),
    ];
    expect(deriveStepStatuses(events, ["one", "two"])).toEqual({
      one: "running",
      two: "pending",
    });
  });

  it("marks a step completed after step.started then step.completed, respecting order", () => {
    const events = [
      makeEvent({ type: "step.started", stepid: "one", data: { status: "started" } } as never),
      makeEvent({ type: "step.completed", stepid: "one", data: { status: "success" } } as never),
    ];
    expect(deriveStepStatuses(events, ["one"])).toEqual({ one: "completed" });
  });

  it("marks a step failed on step.failed", () => {
    const events = [
      makeEvent({ type: "step.failed", stepid: "one", data: { status: "failure" } } as never),
    ];
    expect(deriveStepStatuses(events, ["one"])).toEqual({ one: "failed" });
  });

  it("handles step.reused with success and failure status", () => {
    const successEvents = [
      makeEvent({ type: "step.reused", stepid: "one", data: { status: "success" } } as never),
    ];
    expect(deriveStepStatuses(successEvents, ["one"])).toEqual({ one: "completed" });

    const failureEvents = [
      makeEvent({ type: "step.reused", stepid: "one", data: { status: "failure" } } as never),
    ];
    expect(deriveStepStatuses(failureEvents, ["one"])).toEqual({ one: "failed" });
  });

  it("ignores events for unknown step ids without crashing", () => {
    const events = [
      makeEvent({ type: "step.started", stepid: "unknown-step", data: { status: "started" } } as never),
    ];
    expect(deriveStepStatuses(events, ["one"])).toEqual({ one: "pending" });
  });

  it("ignores job.* and step.planned events", () => {
    const events = [
      makeEvent({ type: "step.planned", stepid: "one", data: {} } as never),
      makeEvent({ type: "job.httpjson.submitted", stepid: "one", data: {} } as never),
    ];
    expect(deriveStepStatuses(events, ["one"])).toEqual({ one: "pending" });
  });
});
