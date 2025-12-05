import { StepHttpJson } from "@lcase/types";
import {
  EngineEffect,
  EngineState,
  Planner,
  StartHttjsonStepMsg,
} from "../engine.js";

export const startHttjsonStepPlanner: Planner<StartHttjsonStepMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: StartHttjsonStepMsg;
}): EngineEffect[] | void => {
  const { message, newState } = args;
  const { runId, stepId } = message;
  const step = newState.runs[message.runId].definition.steps[
    message.stepId
  ] as StepHttpJson;
  return [
    {
      kind: "EmitJobHttpjsonSubmittedEvent",
      data: {
        job: {
          capid: "httpjson",
          id: "",
          toolid: null,
        },
        url: step.url,
        body: step.body,
        method: step.method,
        headers: step.headers,
      },
      eventType: "job.httpjson.submitted",
      traceId: newState.runs[runId].traceId,
      scope: {
        capid: "httpjson",
        flowid: newState.runs[runId].flowId,
        jobid: "",
        runid: runId,
        stepid: stepId,
        source: "lowercase://engine",
        toolid: null,
      },
    },
  ];
};
