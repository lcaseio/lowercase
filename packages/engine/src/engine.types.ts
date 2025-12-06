import type {
  CloudScope,
  FlowCompletedData,
  FlowDefinition,
  FlowFailedData,
  FlowScope,
  FlowStartedData,
  JobHttpJsonData,
  JobScope,
  StepCompletedData,
  StepFailedData,
  StepScope,
  StepStartedData,
} from "@lcase/types";
import type { RunContext } from "@lcase/types/engine";

export type EngineState = {
  runs: Record<string, RunContext>;
};
export type Patch = Partial<EngineState>;

// messages
export type FlowSubmittedMsg = {
  type: "FlowSubmitted";
  flowId: string;
  runId: string;
  definition: FlowDefinition;
  meta: {
    traceId: string;
    spanId?: string;
    traceparent?: string;
  };
};

export type StepReadyToStartMsg = {
  type: "StepReadyToStart";
  runId: string;
  stepId: string;
};

export type StartHttpJsonStepMsg = {
  type: "StartHttpjsonStep";
  runId: string;
  stepId: string;
};

export type JobCompletedMsg = {
  type: "JobCompleted";
  runId: string;
  stepId: string;
};

export type JobFailedMsg = {
  type: "JobFailed";
  runId: string;
  stepId: string;
  reason: string;
};
export type FlowCompletedMsg = {
  type: "FlowCompleted";
  runId: string;
  stepId: string;
};
export type FlowFailedMsg = {
  type: "FlowFailed";
  runId: string;
  stepId: string;
};

export type EngineMessage =
  | FlowSubmittedMsg
  | StepReadyToStartMsg
  | StartHttpJsonStepMsg
  | JobCompletedMsg
  | JobFailedMsg
  | FlowCompletedMsg
  | FlowFailedMsg;

export type MessageType = EngineMessage["type"];

// effects
export type EmitEventFx = {
  kind: "EmitEvent";
  eventType: string;
  data: unknown;
};
export type EmitFlowStartedFx = {
  kind: "EmitFlowStartedEvent";
  eventType: "flow.started";
  scope: FlowScope & CloudScope;
  data: FlowStartedData;
  traceId: string;
};
export type EmitStepStartedFx = {
  kind: "EmitStepStarted";
  eventType: "step.started";
  scope: StepScope & CloudScope;
  data: StepStartedData;
  traceId: string;
};
export type EmitStepCompletedFx = {
  kind: "EmitStepCompleted";
  eventType: "step.compelted";
  scope: StepScope & CloudScope;
  data: StepCompletedData;
  traceId: string;
};
export type EmitStepFailedFx = {
  kind: "EmitStepFailed";
  eventType: "step.failed";
  scope: StepScope & CloudScope;
  data: StepFailedData;
  traceId: string;
};
export type EmitJobHttpJsonSubmittedFx = {
  kind: "EmitJobHttpjsonSubmittedEvent";
  eventType: "job.httpjson.submitted";
  scope: JobScope & CloudScope;
  data: JobHttpJsonData;
  traceId: string;
};
export type EmitFlowFailedFx = {
  kind: "EmitFlowFailed";
  eventType: "flow.failed";
  scope: FlowScope & CloudScope;
  data: FlowFailedData;
  traceId: string;
};
export type EmitFlowCompletedFx = {
  kind: "EmitFlowCompleted";
  eventType: "flow.completed";
  scope: FlowScope & CloudScope;
  data: FlowCompletedData;
  traceId: string;
};
export type DispatchInternalFx = {
  kind: "DispatchInternal";
  message: EngineMessage;
};

export type EngineEffect =
  | EmitEventFx
  | DispatchInternalFx
  | EmitStepStartedFx
  | EmitStepCompletedFx
  | EmitStepFailedFx
  | EmitJobHttpJsonSubmittedFx
  | EmitFlowStartedFx
  | EmitFlowCompletedFx
  | EmitFlowFailedFx;

// reducers
export type Reducer<M extends EngineMessage = EngineMessage> = (
  state: EngineState,
  message: M
) => Patch | void;

// planners
export type Planner<M extends EngineMessage = EngineMessage> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: M;
}) => EngineEffect[] | void;

// handlers
export type EffectHandler<K extends EngineEffect["kind"]> = (
  effect: Extract<EngineEffect, { kind: K }>
) => void | Promise<void>;
