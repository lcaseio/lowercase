import type {
  CloudScope,
  FlowCompletedData,
  FlowDefinition,
  FlowFailedData,
  FlowScope,
  FlowStartedData,
  JobHttpJsonData,
  JobMcpData,
  JobScope,
  StepCompletedData,
  StepFailedData,
  StepScope,
  StepStartedData,
} from "@lcase/types";
import type { RunContext } from "@lcase/types/engine";

export type EngineState = {
  runs: Record<string, RunContext>;
  flows: Record<string, FlowContext>;
};

export type FlowContext = {
  runIds: Record<string, boolean>;
  definition: FlowDefinition;
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
export type StartMcpStepMsg = {
  type: "StartMcpStep";
  runId: string;
  stepId: string;
};

export type StartParallelMsg = {
  type: "StartParallel";
  runId: string;
  stepId: string;
};

export type JobCompletedMsg = {
  type: "JobCompleted";
  runId: string;
  stepId: string;
  result: Record<string, unknown>;
};

export type JobFailedMsg = {
  type: "JobFailed";
  runId: string;
  stepId: string;
  reason: string;
  result: Record<string, unknown>;
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
export type StartJoinMsg = {
  type: "StartJoin";
  runId: string;
  stepId: string;
  joinStepId: string;
};
export type UpdateJoinMsg = {
  type: "UpdateJoin";
  runId: string;
  stepId: string;
  joinStepId: string;
};

export type EngineMessage =
  | FlowSubmittedMsg
  | StepReadyToStartMsg
  | StartParallelMsg
  | StartHttpJsonStepMsg
  | StartMcpStepMsg
  | JobCompletedMsg
  | JobFailedMsg
  | FlowCompletedMsg
  | FlowFailedMsg
  | StartJoinMsg
  | UpdateJoinMsg;

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
export type EmitJoinStepStartedFx = {
  kind: "EmitJoinStepStarted";
  scope: StepScope & CloudScope;
  data: StepStartedData;
  traceId: string;
};
export type EmitStepCompletedFx = {
  kind: "EmitStepCompleted";
  eventType: "step.completed";
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

export type EmitJobMcpSubmittedFx = {
  kind: "EmitJobMcpSubmittedEvent";
  eventType: "job.mcp.submitted";
  scope: JobScope & CloudScope;
  data: JobMcpData;
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
export type WriteContextToDiskFx = {
  kind: "WriteContextToDisk";
  context: RunContext;
  runId: string;
};
export type DispatchInternalFx = {
  kind: "DispatchInternal";
  message: EngineMessage;
};

export type EngineEffect =
  | EmitEventFx
  | DispatchInternalFx
  | EmitStepStartedFx
  | EmitJoinStepStartedFx
  | EmitStepCompletedFx
  | EmitStepFailedFx
  | EmitJobHttpJsonSubmittedFx
  | EmitJobMcpSubmittedFx
  | EmitFlowStartedFx
  | EmitFlowCompletedFx
  | EmitFlowFailedFx
  | WriteContextToDiskFx;

// reducers
export type Reducer<M extends EngineMessage = EngineMessage> = (
  state: EngineState,
  message: M
) => Patch | void;

// planners
export type PlannerArgs<M extends EngineMessage = EngineMessage> = {
  oldState: EngineState;
  newState: EngineState;
  message: M;
};
export type Planner<M extends EngineMessage = EngineMessage> = (
  args: PlannerArgs<M>
) => EngineEffect[] | void;

// handlers
export type EffectHandler<K extends EngineEffect["kind"]> = (
  effect: Extract<EngineEffect, { kind: K }>
) => void | Promise<void>;
