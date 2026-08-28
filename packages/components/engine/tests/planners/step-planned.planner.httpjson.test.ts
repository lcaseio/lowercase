import { describe, expect, it } from "vitest";
import type { RunContext, AnyEvent } from "@lcase/types";
import type {
  EmitJobHttpJsonSubmittedFx,
  EngineState,
  ExecuteHttpJsonJobFx,
} from "../../src/engine.types.js";
import type { StepPlannedMsg } from "../../src/types/message.types.js";
import { stepPlannedPlanner } from "../../src/planners/step-planned.planner.js";
import { flowDef } from "../fixtures/flow-definition.js";
import { flowAnalysisB } from "../fixtures/flow-analysis.state.js";

// Worker V2 plan Phase 4: the shared step-planned.state.ts fixture puts step
// "b" in runPlan.reuse, which takes stepPlannedPlanner's early-return
// EmitStepReused branch -- this fixture instead reaches the real httpjson
// dispatch branch, to assert both EmitJobHttpJsonSubmittedFx (unchanged) and
// the new ExecuteHttpJsonJobFx get pushed together.
function makeNewState(): EngineState {
  return {
    runs: {
      "test-runid": {
        flowId: "test-flowid",
        flowVersionId: "test-flowversionid",
        flowDefHash: "test-flowdefhash",
        forkSpecHash: "test-forkspechash",
        runId: "test-runid",
        traceId: "test-traceid",
        params: {},
        runPlan: { reuse: {} },
        startedSteps: { parallel: true },
        plannedSteps: {},
        completedSteps: {},
        failedSteps: {},
        outstandingSteps: 1,
        input: {},
        status: "started",
        steps: {
          b: {
            status: "initialized",
            attempt: 0,
            output: {},
            outputHash: null,
            exportHashes: {},
            resolved: {},
          },
          parallel: {
            status: "started",
            attempt: 0,
            output: {},
            outputHash: null,
            exportHashes: {},
            resolved: {},
          },
        },
        flowAnalysis: flowAnalysisB,
      } satisfies RunContext,
    },
    flows: {
      "test-flowversionid": {
        definition: flowDef,
        runIds: { "test-runid": true },
      },
    },
  };
}

function makeMessage(): StepPlannedMsg {
  return {
    type: "StepPlanned",
    event: {
      data: { step: { id: "b", name: "b", type: "httpjson" } },
      id: "test-id",
      source: "test-source",
      specversion: "1.0",
      time: "test-time",
      type: "step.planned",
      domain: "step",
      action: "planned",
      traceparent: "test-traceparent",
      traceid: "test-traceid",
      spanid: "test-spanid",
      flowid: "test-flowid",
      flowversionid: "test-flowversionid",
      runid: "test-runid",
      stepid: "b",
      steptype: "httpjson",
    } satisfies AnyEvent<"step.planned">,
  };
}

describe("stepPlannedPlanner() -- httpjson step", () => {
  it("pushes both EmitJobHttpJsonSubmitted (unchanged) and ExecuteHttpJsonJob", () => {
    const oldState = makeNewState();
    const newState = makeNewState();
    const message = makeMessage();

    const effects = stepPlannedPlanner(oldState, newState, message);

    const submitted = effects.find(
      (e) => e.type === "EmitJobHttpJsonSubmitted",
    ) as EmitJobHttpJsonSubmittedFx | undefined;
    const executed = effects.find((e) => e.type === "ExecuteHttpJsonJob") as
      ExecuteHttpJsonJobFx | undefined;

    expect(submitted).toBeDefined();
    expect(submitted?.data.url).toBe("test-url");

    expect(executed).toBeDefined();
    expect(executed).toMatchObject({
      request: {
        runId: "test-runid",
        stepId: "b",
        protocol: { kind: "httpjson", url: "test-url" },
      },
      scope: {
        flowid: "test-flowid",
        flowversionid: "test-flowversionid",
        runid: "test-runid",
        stepid: "b",
        capid: "httpjson",
        toolid: "httpjson",
      },
    });
    // The dispatch's own jobId is generated fresh, independent of whatever
    // EmitJobHttpJsonSubmittedFx's own handler later generates for itself --
    // documented divergence, see step-planned.planner.ts's comment.
    expect(executed?.request.jobId).toEqual(executed?.scope.jobid);
  });
});
