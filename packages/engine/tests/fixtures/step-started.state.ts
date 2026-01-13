import type { RunContext } from "@lcase/types/engine";
import type {
  EngineState,
  FlowContext,
  FlowSubmittedMsg,
} from "../../src/engine.types";
import { flowSubmittedEvent } from "./flow-submitted.event";
import { flowAnalysis } from "./flow-analysis.state";
const stepId = "test-stepid";
export const stepPlannedNewState: EngineState = {
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
  plannedSteps: {}, // remove step to object for set like lookup
  startedSteps: { parallel: true },
  completedSteps: {},
  failedSteps: {},
  outstandingSteps: 1,

  input: message.event.data.definition.inputs ?? {},

  status: "started",
  steps: {
    parallel: {
      status: "started", // changed from planned to started
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

stepPlannedNewState.runs[message.event.runid] = runCtx;
stepPlannedNewState.flows[message.event.flowid] = flowCtx;
