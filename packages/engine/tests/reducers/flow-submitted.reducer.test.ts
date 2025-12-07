import type { RunContext } from "@lcase/types/engine";
import { flowSubmittedReducer } from "../../src/reducers/flow-submitted.reducer.js";
import type { FlowSubmittedMsg, EngineState } from "../../src/engine.types.js";
import { describe, it, expect } from "vitest";

describe("flowSubmittedReducer", () => {
  it("updates empty state correctly", () => {
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
      activeJoinSteps: new Set<string>(),
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
          joins: new Set(),
        },
      },
    } satisfies RunContext;
    const expectedState = { runs: { ["test-id"]: runCtx } };
    const newState = flowSubmittedReducer(state, flowSubmittedMessage);
    expect(newState).toEqual(expectedState);
  });
});
