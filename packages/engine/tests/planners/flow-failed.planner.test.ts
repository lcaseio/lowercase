import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EmitFlowFailedFx,
  EngineState,
  FlowFailedMsg,
} from "../../src/engine.types.js";
import type { FlowDefinition } from "@lcase/types";
import { flowFailedPlanner } from "../../src/planners/flow-failed.planner.js";

describe("flowFailedPlanner", () => {
  it("gives correct effects for a proper message and context", () => {
    const runId = "test-runId";
    const stepId = "test-stepId";
    const flowFailedMsg: FlowFailedMsg = {
      type: "FlowFailed",
      runId,
      stepId,
    };
    const runCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: {
          [stepId]: {
            on: {
              success: "stepTwo",
            },
          },
        },
      } as unknown as FlowDefinition,
      runId,
      traceId: "test-traceId",
      runningSteps: new Set<string>([stepId]),
      activeJoinSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 1,
      inputs: {},
      exports: {},
      globals: {},
      status: "started",
      steps: {
        [stepId]: {
          status: "started",
          attempt: 1,
          exports: {},
          result: {},
          stepId: stepId,
          joins: new Set(),
          resolved: {},
        },
      },
    } satisfies RunContext;

    const newRunCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: {
          [stepId]: {
            on: {
              success: "stepTwo",
            },
          },
        },
      } as unknown as FlowDefinition,
      runId,
      traceId: "test-traceId",
      runningSteps: new Set<string>(),
      activeJoinSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>([stepId]),
      outstandingSteps: 0,
      inputs: {},
      exports: {},
      globals: {},
      status: "failed",
      steps: {
        [stepId]: {
          status: "failed",
          attempt: 1,
          exports: {},
          result: {},
          stepId,
          joins: new Set(),
          resolved: {},
        },
      },
    } satisfies RunContext;
    const oldState: EngineState = { runs: { [runId]: runCtx } };
    const newState: EngineState = { runs: { [runId]: newRunCtx } };
    const effects = flowFailedPlanner({
      oldState,
      newState,
      message: flowFailedMsg,
    });

    const expectedEffectPlan = {
      kind: "EmitFlowFailed",
      data: {
        flow: {
          id: newRunCtx.flowId,
          name: newRunCtx.flowName,
          version: newRunCtx.definition.version,
        },
        run: { id: runId },
        status: "failure",
      },
      eventType: "flow.failed",
      scope: {
        flowid: newRunCtx.flowId,
        source: "lowercase://engine",
      },
      traceId: newRunCtx.traceId,
    } satisfies EmitFlowFailedFx;

    expect(effects).toEqual([expectedEffectPlan]);
  });
});
