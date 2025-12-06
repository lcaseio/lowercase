import type { RunContext } from "@lcase/types/engine";
import { flowSubmittedPlanner } from "../../src/planners/flow-submitted.planner.js";
import type {
  FlowSubmittedMsg,
  EngineState,
  EngineEffect,
} from "../../src/engine.types.js";
import { describe, it, expect } from "vitest";

describe("flowSubmittedPlanner", () => {
  it("generates an expected plan", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const flowSubmittedMessage: FlowSubmittedMsg = {
      type: "FlowSubmitted",
      flowId: "test-id",
      runId: "test-id",
      definition: {
        name: "test",
        version: "test",
        description: "test",
        inputs: {},
        outputs: {},
        start: "",
        steps: {
          start: {
            type: "httpjson",
            url: "",
          },
        },
      },
      meta: {
        traceId: "test",
      },
    };

    const runCtx = {
      flowId: flowSubmittedMessage.flowId,
      flowName: flowSubmittedMessage.definition.name,
      definition: flowSubmittedMessage.definition,
      runId: flowSubmittedMessage.runId,
      traceId: flowSubmittedMessage.meta.traceId,
      runningSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 0,
      inputs: flowSubmittedMessage.definition.inputs ?? {},
      exports: {},
      globals: {},
      status: "pending",
      steps: {
        start: {
          status: "pending",
          attempt: 0,
          exports: {},
          result: {},
          stepId: "start",
        },
      },
    } satisfies RunContext;
    const testNewState = { runs: { ["test-id"]: runCtx } };
    const effectPlans = flowSubmittedPlanner({
      oldState: { runs: {} },
      newState: testNewState,
      message: flowSubmittedMessage,
    });

    const expectedEffectPlans: EngineEffect[] = [
      {
        kind: "EmitFlowStartedEvent",
        eventType: "flow.started",
        data: {
          flow: {
            id: flowSubmittedMessage.flowId,
            name: flowSubmittedMessage.definition.name,
            version: flowSubmittedMessage.definition.version,
          },
        },
        scope: {
          flowid: flowSubmittedMessage.flowId,
          source: "lowercase://engine",
        },
        traceId: "test",
      },
      {
        kind: "DispatchInternal",
        message: {
          type: "StepReadyToStart",
          runId: runCtx.runId,
          stepId: runCtx.definition.start,
        },
      },
    ];
    expect(effectPlans).toEqual(expectedEffectPlans);
  });
});
