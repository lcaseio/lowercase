import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EmitJobMcpSubmittedFx,
  EngineState,
  StartMcpStepMsg,
} from "../../src/engine.types.js";
import { starMcpStepPlanner } from "../../src/planners/start-mcp-step.planner.js";

describe("startMcpStepPlanner", () => {
  it("gives correct effects for a proper message and context", () => {
    const runId = "test-id";
    const stepId = "test-stepId";
    const state = {
      runs: {},
    } satisfies EngineState;

    const starMcpStepMsg: StartMcpStepMsg = {
      type: "StartMcpStep",
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
            type: "mcp",
            url: "test-url",
            feature: {
              name: "",
              primitive: "tool",
            },
            transport: "http",
          },
        },
      },
      runId: "test-id",
      traceId: "test-traceId",
      runningSteps: new Set<string>(),
      activeJoinSteps: new Set<string>(),
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
          joins: new Set(),
          resolved: {},
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
    const effects = starMcpStepPlanner({
      oldState,
      newState,
      message: starMcpStepMsg,
    });

    const expectedEffectPlan = {
      kind: "EmitJobMcpSubmittedEvent",
      eventType: "job.mcp.submitted",
      scope: {
        capid: "mcp",
        flowid: "test-flowId",
        jobid: "", // FIXME: possibly null or created earlier
        runid: "test-id",
        source: "lowercase://engine",
        stepid: "test-stepId",
        toolid: null,
      },
      data: {
        job: {
          capid: "mcp",
          id: "", // FIXME: possibly null or created earlier
          toolid: null,
        },
        url: "test-url",
        feature: { name: "", primitive: "tool" },
        transport: "http",
        args: newState.runs[runId].steps[stepId].args,
      },
      traceId: "test-traceId",
    } satisfies EmitJobMcpSubmittedFx;

    expect(effects).toEqual([expectedEffectPlan]);
  });
});
