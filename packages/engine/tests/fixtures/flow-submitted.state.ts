import type { RunContext } from "@lcase/types/engine";
import type {
  EngineState,
  FlowContext,
  FlowSubmittedMsg,
} from "../../src/engine.types";
import { flowSubmittedEvent } from "./flow-submitted.event";

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
    [stepId]: {
      status: "initialized",
      attempt: 0,
      output: {},
      resolved: {},
    },
  },
  flowAnalysis: {
    nodes: [],
    inEdges: {},
    outEdges: {},
    joinDeps: {},
    problems: [],
    refs: [],
  },
} satisfies RunContext;

const flowCtx: FlowContext = {
  definition: message.event.data.definition,
  runIds: { [message.event.runid]: true },
};

flowSubmittedNewState.runs[message.event.runid] = runCtx;
flowSubmittedNewState.flows[message.event.flowid] = flowCtx;
