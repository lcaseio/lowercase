import { describe, it, expect } from "vitest";
import { deriveSpanId, deriveSpanFor } from "../src/core/span.js";

describe("deriveSpanId() and deriveSpanFor()", () => {
  it("derives the same span id for the same identity key", () => {
    expect(deriveSpanId("step", "run-1", "step-a")).toBe(
      deriveSpanId("step", "run-1", "step-a"),
    );
  });

  it("derives a different span id for a different stepid", () => {
    expect(deriveSpanId("step", "run-1", "step-a")).not.toBe(
      deriveSpanId("step", "run-1", "step-b"),
    );
  });

  it("derives a different span id when the same step recurs under a different run (reuse case)", () => {
    expect(deriveSpanId("step", "run-1", "step-a")).not.toBe(
      deriveSpanId("step", "run-2", "step-a"),
    );
  });

  it("formats as a W3C-shaped 16 hex character span id", () => {
    expect(deriveSpanId("step", "run-1", "step-a")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("derives a step's parent span by reference to its run, keyed on runid alone", () => {
    const derived = deriveSpanFor("step", { runid: "run-1", stepid: "step-a" });
    expect(derived?.parentSpanId).toBe(deriveSpanId("run", "run-1"));
  });

  it("returns undefined for a domain with no registered span config", () => {
    expect(
      deriveSpanFor("job", { runid: "run-1", jobid: "job-a" }),
    ).toBeUndefined();
  });
});
