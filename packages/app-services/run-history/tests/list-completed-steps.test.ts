import { describe, expect, it } from "vitest";
import type { RunIndex } from "@lcase/ports";
import { listCompletedSteps } from "../src/list-completed-steps.js";
describe("run-history listCompletedSteps()", () => {
  it("returns the correct step hashes from a list of steps", async () => {
    const index: RunIndex = {
      flowId: "",
      traceId: "",
      steps: {
        a: {
          outputHash: "test-hash-a",
          status: "failed",
        },
        b: {
          outputHash: "test-hash-b",
          status: "success",
        },
        c: {
          outputHash: "test-hash-c",
          status: "success",
        },
      },
    };
    const steps = listCompletedSteps(index);

    expect(steps).toEqual(["b", "c"]);
  });
});
