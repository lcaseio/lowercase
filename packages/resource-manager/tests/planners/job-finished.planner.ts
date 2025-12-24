import { describe, it, expect } from "vitest";
import { jobFinishedMsg } from "../fixtures/job-finished/message.js";
import { startState, endState } from "../fixtures/job-finished/state.js";
import {
  startStateDelayed,
  endStateDelayed,
} from "../fixtures/job-finished/delayed-state.js";

describe("jobFinishedPlanner", () => {
  it("makes the correct plans", () => {
    const {} = jobFinishedFixture;
    const expectedState = structuredClone(jobFinishedFixture.state.noDelayed);
  });
});
