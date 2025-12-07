import { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EngineEffect,
  EngineState,
  StepReadyToStartMsg,
} from "../../src/engine.types.js";
import { stepReadyToStartPlanner } from "../../src/planners/step-ready-to-start.planner.js";

describe("stepReadyToStartPlanner", () => {
  it("produces correct side effect plan for give state and message", () => {
    const state = {
      runs: {},
    } satisfies EngineState;
    const stepId = "test-stepId";
    const runId = "test-runId";
    const stepReadyToStartMsg: StepReadyToStartMsg = {
      type: "StepReadyToStart",
      runId,
      stepId,
    };

    const runCtx = {
      flowId: "",
      flowName: "",
      definition: {
        name: "",
        version: "",
        start: "",
        steps: {
          [stepId]: {
            type: "httpjson",
            url: "",
          },
        },
      },
      runId,
      traceId: "",
      runningSteps: new Set<string>(),
      activeJoinSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 0,
      inputs: {},
      exports: {},
      globals: {},
      status: "pending",
      steps: {
        [stepId]: {
          status: "pending",
          attempt: 0,
          exports: {},
          result: {},
          stepId: "start",
          joins: new Set(),
        },
      },
    } satisfies RunContext;

    const newRunContext = { ...runCtx, status: "started" };
    const testNewState = { runs: { [runId]: runCtx } };
    const effectPlans = stepReadyToStartPlanner({
      oldState: { runs: {} },
      newState: testNewState,
      message: stepReadyToStartMsg,
    });

    const expectedEffectPlans: EngineEffect[] = [
      {
        kind: "EmitStepStarted",
        data: {
          status: "started",
          step: {
            id: stepId,
            name: stepId,
            type: testNewState.runs[runId].definition.steps[stepId].type,
          },
        },
        eventType: "step.started",
        scope: {
          flowid: testNewState.runs[runId].flowId,
          runid: runId,
          source: "lowercase://engine",
          stepid: stepId,
          steptype: testNewState.runs[runId].definition.steps[stepId].type,
        },
        traceId: testNewState.runs[runId].traceId,
      },
      {
        kind: "DispatchInternal",
        message: {
          type: "StartHttpjsonStep",
          runId,
          stepId,
        },
      },
    ];
    expect(effectPlans).toEqual(expectedEffectPlans);
  });
});
