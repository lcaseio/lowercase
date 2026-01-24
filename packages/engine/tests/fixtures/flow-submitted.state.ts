import type { RunContext } from "@lcase/types";
import type {
  EngineState,
  FlowContext,
  FlowSubmittedMsg,
} from "../../src/engine.types.js";
import { flowSubmittedEvent } from "./flow-submitted.event.js";
import { flowAnalysis } from "./flow-analysis.state.js";

const stepId = "test-stepid";
export const flowSubmittedOldState: EngineState = {
  runs: {},
  flows: {},
};

export const flowSubmittedNewState: EngineState = {
  runs: {},
  flows: {},
};

const message: FlowSubmittedMsg = {
  type: "FlowSubmitted",
  event: flowSubmittedEvent,
};

const runCtx = {
  flowId: message.event.flowid,
  flowDefHash: "test-flow-hash",
  runId: message.event.runid,
  traceId: message.event.traceid,

  runPlan: {
    reuse: {},
  },

  plannedSteps: {},
  startedSteps: {},
  completedSteps: {},
  failedSteps: {},
  outstandingSteps: 0,

  input: message.event.data.definition.inputs ?? {},

  status: "started",
  steps: {
    parallel: {
      attempt: 0,
      output: {},
      resolved: {},
      status: "initialized",
      outputHash: null,
    },

    [stepId]: {
      status: "initialized",
      attempt: 0,
      output: {},
      resolved: {},
      outputHash: null,
    },
  },
  flowAnalysis: flowAnalysis,
} satisfies RunContext;

const flowCtx: FlowContext = {
  definition: message.event.data.definition,
  runIds: { [message.event.runid]: true },
};

flowSubmittedNewState.runs[message.event.runid] = runCtx;
flowSubmittedNewState.flows[message.event.flowid] = flowCtx;
