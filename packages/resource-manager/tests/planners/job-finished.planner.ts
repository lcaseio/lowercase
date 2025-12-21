import { describe, it, expect } from "vitest";
import { jobFinishedFixture } from "../fixtures/job-finished.fixture";

describe("jobFinishedPlanner", () => {
  it("makes the correct plans", () => {
    const {} = jobFinishedFixture;
    const expectedState = structuredClone(jobFinishedFixture.state.noDelayed);
  });
});
