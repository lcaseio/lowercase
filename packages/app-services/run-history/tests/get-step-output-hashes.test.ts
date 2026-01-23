import { describe, expect, it, vi } from "vitest";
import { getStepOutputHashes } from "../src/get-step-output-hashes.js";
import { RunIndex, RunIndexStorePort } from "@lcase/ports";
describe("run-history getStepOutputHashes()", () => {
  it("returns the correct step hashes from a list of steps", async () => {
    const index: RunIndex = {
      flowId: "",
      traceId: "",
      steps: {
        a: {
          outputHash: "test-hash-a",
        },
        b: {
          outputHash: "test-hash-b",
        },
        c: {
          outputHash: "test-hash-c",
        },
      },
    };

    const getRunIndex = vi.fn().mockReturnValue(index);
    const store = { getRunIndex } as unknown as RunIndexStorePort;

    const result = await getStepOutputHashes(["a", "b"], "test-runid", store);

    const expectedResult = {
      a: "test-hash-a",
      b: "test-hash-b",
    };
    expect(result).toEqual(expectedResult);
  });
});
