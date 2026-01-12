import { describe, it, expect } from "vitest";
import type { RunContext } from "@lcase/types/engine";
import type {
  FlowSubmittedMsg,
  EngineState,
  EngineEffect,
  FlowContext,
  EmitRunStartedFx,
} from "../../src/engine.types.js";
import { flowSubmittedEvent } from "../fixtures/flow-submitted.event.js";
import { flowSubmittedPlanner } from "../../src/planners/flow-submitted.planner.js";

describe("flowSubmittedPlanner", () => {
  it("generates an EmitRunStartedFx when run context status is 'started'", () => {
    const oldState: EngineState = {
      runs: {},
      flows: {},
    };

    const newState: EngineState = {
      runs: {},
      flows: {},
    };
    const message: FlowSubmittedMsg = {
      type: "FlowSubmitted",
      event: flowSubmittedEvent,
    };

    newState.runs[message.event.runid] = {
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

    newState.flows[message.event.flowid] = {
      definition: message.event.data.definition,
      runIds: { [message.event.runid]: true },
    } satisfies FlowContext;

    const effectPlans = flowSubmittedPlanner(oldState, newState, message);

    const expectedEffectPlans: EngineEffect[] = [
      {
        type: "EmitFlowAnalyzed",
        data: {
          analysis: {
            nodes: ["start"],
            inEdges: {},
            outEdges: {},
            joinDeps: {},
            refs: [],
            problems: [],
          },
          flow: {
            id: message.event.flowid,
            name: message.event.data.flow.name,
            version: message.event.data.flow.version,
          },
          run: {
            id: message.event.runid,
          },
        },
        scope: {
          flowid: message.event.flowid,
          runid: message.event.runid,
          source: "lowercase://engine",
        },
        traceId: message.event.traceid,
      },
      {
        type: "EmitRunStarted",
        data: null,
        scope: {
          flowid: message.event.flowid,
          runid: message.event.runid,
          source: "lowercase://engine",
        },
        traceId: message.event.traceid,
      } satisfies EmitRunStartedFx,
    ];
    expect(effectPlans).toEqual(expectedEffectPlans);
  });
});
