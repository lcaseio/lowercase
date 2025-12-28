import { describe, it, expect } from "vitest";
import { jobFinishedMsg } from "../fixtures/job-finished/message.js";
import {
  startStateDelayed,
  endStateDelayed,
} from "../fixtures/job-finished/delayed-state.js";
import { jobFinishedPlanner } from "../../src/planners/job-finished.planner.js";
import type { ResumeJobFx } from "../../src/scheduler.types.js";
import {} from "../fixtures/job-finished/message.js";

describe("jobFinishedPlanner", () => {
  it("creates a resume job effect when state has a delayed job", () => {
    const expectedEffects: ResumeJobFx[] = [
      {
        type: "ResumeJob",
        event: jobFinishedMsg.event,
      },
    ];
    const effects = jobFinishedPlanner(
      startStateDelayed,
      endStateDelayed,
      jobFinishedMsg
    );
    expect(effects).toEqual(expectedEffects);
  });
});
