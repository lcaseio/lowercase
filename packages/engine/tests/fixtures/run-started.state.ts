import type { RunContext } from "@lcase/types/engine";
import type {
  EngineState,
  FlowContext,
  FlowSubmittedMsg,
} from "../../src/engine.types";
import { flowSubmittedEvent } from "./flow-submitted.event";
import { flowAnalysis } from "./flow-analysis.state";

const stepId = "test-stepid";
export const runStartedNewState: EngineState = {
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
  plannedSteps: { parallel: true }, // add step to object for set like lookup
  startedSteps: {},
  completedSteps: {},
  failedSteps: {},
  outstandingSteps: 1, // incremented as planned is considered outstanding

  input: message.event.data.definition.inputs ?? {},
  status: "started",
  steps: {
    parallel: {
      status: "planned", // changed from initialized to planned
      attempt: 0,
      output: {},
      resolved: {},
    },
    [stepId]: {
      status: "initialized",
      attempt: 0,
      output: {},
      resolved: {},
    },
  },
  flowAnalysis: flowAnalysis,
} satisfies RunContext;

const flowCtx: FlowContext = {
  definition: message.event.data.definition,
  runIds: { [message.event.runid]: true },
};

runStartedNewState.runs[message.event.runid] = runCtx;
runStartedNewState.flows[message.event.flowid] = flowCtx;
