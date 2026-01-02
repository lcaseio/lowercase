import type { RunContext } from "@lcase/types/engine";
import type {
  EngineState,
  FlowContext,
  FlowSubmittedMsg,
} from "../../src/engine.types";
import { flowSubmittedEvent } from "./flow-submitted.event";

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
  activeJoinSteps: {},
  plannedSteps: {},
  startedSteps: {},
  completedSteps: {},
  failedSteps: {},
  outstandingSteps: 0,

  inputs: message.event.data.definition.inputs ?? {},
  exports: {},
  globals: {},
  status: "started",
  steps: {
    start: {
      status: "initialized",
      attempt: 0,
      exports: {},
      result: {},
      stepId: "start",
      joins: {},
      resolved: {},
    },
  },
} satisfies RunContext;

const flowCtx: FlowContext = {
  definition: message.event.data.definition,
  runIds: { [message.event.runid]: true },
};

flowSubmittedNewState.runs[message.event.runid] = runCtx;
flowSubmittedNewState.flows[message.event.flowid] = flowCtx;
