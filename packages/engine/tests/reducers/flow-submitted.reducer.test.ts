import { describe, it, expect } from "vitest";
import type { RunContext } from "@lcase/types/engine";
import type {
  FlowSubmittedMsg,
  EngineState,
  FlowContext,
} from "../../src/engine.types.js";
import { flowSubmittedReducer } from "../../src/reducers/flow-submitted.reducer.js";
import { flowSubmittedEvent } from "../fixtures/flow-submitted.event.js";

describe("flowSubmittedReducer", () => {
  it("initializes run and flow state as started when analysis passes", () => {
    const startState: EngineState = {
      runs: {},
      flows: {},
    };

    const expectedState: EngineState = {
      runs: {},
      flows: {},
    };

    const message: FlowSubmittedMsg = {
      type: "FlowSubmitted",
      event: flowSubmittedEvent,
    };

    const runCtx = {
      flowId: message.event.flowid,
      flowName: message.event.data.flow.name,
      flowVersion: message.event.data.flow.version,
      runId: message.event.runid,
      traceId: message.event.traceid,
      plannedSteps: {},
      startedSteps: {},
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 0,

      input: message.event.data.definition.inputs ?? {},
      status: "started",
      steps: {
        start: {
          status: "initialized",
          attempt: 0,
          output: {},
          resolved: {},
        },
      },
      flowAnalysis: {
        nodes: ["start"],
        inEdges: {},
        outEdges: {},
        joinDeps: {},
        refs: [],
        problems: [],
      },
    } satisfies RunContext;

    const flowCtx: FlowContext = {
      definition: message.event.data.definition,
      runIds: { [message.event.runid]: true },
    };
    expectedState.runs[message.event.runid] = runCtx;
    expectedState.flows[message.event.flowid] = flowCtx;

    const newState = flowSubmittedReducer(startState, message);
    expect(newState).toEqual(expectedState);
  });
});
