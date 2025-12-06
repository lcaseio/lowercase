import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EmitJobHttpjsonSubmittedFx,
  EngineState,
  StartHttpJsonStepMsg,
} from "../../src/engine.types.js";
import { startHttpJsonStepPlanner } from "../../src/planners/start-httpjson-step.planner.js";

describe("stepReadyToStartPlanner", () => {
  it("gives correct effects for a proper message and context", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const startHttpjsonStepMsg: StartHttpJsonStepMsg = {
      type: "StartHttpjsonStep",
      runId: "test-id",
      stepId: "test-stepId",
    };

    const runCtx = {
      flowId: "test-flowId",
      flowName: "",
      definition: {
        name: "",
        version: "",
        start: "test-stepId",
        steps: {
          "test-stepId": {
            type: "httpjson",
            url: "test-url",
          },
        },
      },
      runId: "test-id",
      traceId: "test-traceId",
      runningSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 0,
      inputs: {},
      exports: {},
      globals: {},
      status: "started",
      steps: {
        "test-stepId": {
          status: "pending",
          attempt: 0,
          exports: {},
          result: {},
          stepId: "start",
        },
      },
    } satisfies RunContext;
    const oldState: EngineState = { runs: { ["test-id"]: runCtx } };
    const newRunContext = {
      ...runCtx,
      status: "started" as const,
      outstandingSteps: 1,
      runningSteps: new Set([...runCtx.runningSteps, "test-stepId"]),
      steps: {
        "test-stepId": {
          ...runCtx.steps["test-stepId"],
          status: "started" as const,
          attempt: 1,
        },
      },
    };
    const newState: EngineState = { runs: { ["test-id"]: newRunContext } };
    const effects = startHttpJsonStepPlanner({
      oldState,
      newState,
      message: startHttpjsonStepMsg,
    });

    const expectedEffectPlan = {
      kind: "EmitJobHttpjsonSubmittedEvent",
      eventType: "job.httpjson.submitted",
      scope: {
        capid: "httpjson",
        flowid: "test-flowId",
        jobid: "", // FIXME: possibly null or created earlier
        runid: "test-id",
        source: "lowercase://engine",
        stepid: "test-stepId",
        toolid: null,
      },
      data: {
        job: {
          capid: "httpjson",
          id: "", // FIXME: possibly null or created earlier
          toolid: null,
        },
        url: "test-url",
      },
      traceId: "test-traceId",
    } satisfies EmitJobHttpjsonSubmittedFx;

    expect(effects).toEqual([expectedEffectPlan]);
  });
});
