import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EmitFlowCompletedFx,
  EngineState,
  FlowCompletedMsg,
} from "../../src/engine.types.js";
import type { FlowDefinition } from "@lcase/types";
import { flowCompletedPlanner } from "../../src/planners/flow-completed.planner.js";

describe("stepReadyToStartPlanner", () => {
  it("gives correct effects for a proper message and context", () => {
    const runId = "test-runId";
    const stepId = "test-stepId";
    const flowCompletedMsg: FlowCompletedMsg = {
      type: "FlowCompleted",
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
            type: "httpjson",
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
            type: "httpjson",
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
      status: "completed",
      steps: {
        [stepId]: {
          status: "completed",
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
    const effects = flowCompletedPlanner({
      oldState,
      newState,
      message: flowCompletedMsg,
    });

    const expectedEffectPlan = {
      kind: "EmitFlowCompleted",
      data: {
        flow: {
          id: newRunCtx.flowId,
          name: newRunCtx.flowName,
          version: newRunCtx.definition.version,
        },
        run: { id: runId },
        status: "success",
      },
      eventType: "flow.completed",
      scope: {
        flowid: newRunCtx.flowId,
        runid: runId,
        source: "lowercase://engine",
      },
      traceId: newRunCtx.traceId,
    } satisfies EmitFlowCompletedFx;

    expect(effects).toEqual([expectedEffectPlan]);
  });
});
