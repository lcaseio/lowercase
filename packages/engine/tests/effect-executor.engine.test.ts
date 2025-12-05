import { RunContext } from "@lcase/types/engine";
import { flowSubmittedPlanner } from "../src/planners/flow-submitted.planner.js";
import {
  type FlowSubmittedMsg,
  type EngineState,
  type EngineEffect,
  Engine,
} from "../src/engine.js";
import { describe, it, expect } from "vitest";
import { EngineDeps } from "@lcase/ports/engine";
import { EmitterFactoryPort } from "@lcase/ports";

describe("submitExternal", () => {
  it("generates the expected state for starting an httpjson step", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const ef = {
      newFlowEmitterNewSpan: () => {
        return { emit: () => {} };
      },
      newJobEmitterNewSpan: () => {
        return { emit: () => {} };
      },
    } as unknown as EmitterFactoryPort;

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
        start: "first",
        steps: {
          first: {
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
        first: {
          status: "pending",
          attempt: 0,
          exports: {},
          result: {},
          stepId: "first",
        },
      },
    } satisfies RunContext;
    const testNewState = { runs: { ["test-id"]: runCtx } };

    const finalState = {
      runs: {
        ["test-id"]: {
          ...runCtx,
          status: "started",
          outstandingSteps: 1,
          runningSteps: new Set(["first"]),
          steps: {
            ...runCtx.steps,
            ["first"]: {
              ...runCtx.steps.first,
              status: "started",
              attempt: 1,
            },
          },
        },
      },
    };
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
            id: runCtx.flowId,
            name: runCtx.definition.name,
            version: runCtx.definition.version,
          },
        },
        scope: { flowid: runCtx.flowId, source: "lowercase://engine" },
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

    const engine = new Engine({ ef } as EngineDeps);
    engine.submitExternal(flowSubmittedMessage);
    const state2 = engine.getState();
    expect(effectPlans).toEqual(expectedEffectPlans);
    expect(state2).toEqual(finalState);
  });
});
