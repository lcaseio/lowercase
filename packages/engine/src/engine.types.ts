import { EmitterFactoryPort, QueuePort } from "@lcase/ports";
import type {
  AnyEvent,
  CloudScope,
  FlowCompletedData,
  FlowDefinition,
  FlowFailedData,
  FlowScope,
  FlowStartedData,
  JobHttpJsonData,
  JobMcpData,
  JobScope,
  RunScope,
  RunStartedData,
  StepCompletedData,
  StepFailedData,
  StepPlannedData,
  StepScope,
  StepStartedData,
} from "@lcase/types";
import type { RunContext } from "@lcase/types/engine";

type FlowId = string;
export type EngineState = {
  runs: Record<string, RunContext>;
  flows: Record<FlowId, FlowContext>;
};

export type FlowContext = {
  runIds: Record<string, boolean>;
  definition: FlowDefinition;
};
export type Patch = Partial<EngineState>;

// messages
export type FlowSubmittedMsg = {
  type: "FlowSubmitted";
  event: AnyEvent<"flow.submitted">;
};

export type RunStartedMsg = {
  type: "RunStarted";
  event: AnyEvent<"run.started">;
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
  | RunStartedMsg
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
  type: "EmitEvent";
  eventType: string;
  data: unknown;
};
export type EmitRunStartedFx = {
  type: "EmitRunStarted";
  eventType: "run.started";
  scope: RunScope & CloudScope;
  data: RunStartedData;
  traceId: string;
};
export type EmitStepStartedFx = {
  type: "EmitStepStarted";
  eventType: "step.started";
  scope: StepScope & CloudScope;
  data: StepStartedData;
  traceId: string;
};
export type EmitStepPlannedFx = {
  type: "EmitStepPlanned";
  scope: StepScope & CloudScope;
  data: StepPlannedData;
  traceId: string;
};
export type EmitJoinStepStartedFx = {
  type: "EmitJoinStepStarted";
  scope: StepScope & CloudScope;
  data: StepStartedData;
  traceId: string;
};
export type EmitStepCompletedFx = {
  type: "EmitStepCompleted";
  eventType: "step.completed";
  scope: StepScope & CloudScope;
  data: StepCompletedData;
  traceId: string;
};
export type EmitStepFailedFx = {
  type: "EmitStepFailed";
  eventType: "step.failed";
  scope: StepScope & CloudScope;
  data: StepFailedData;
  traceId: string;
};
export type EmitJobHttpJsonSubmittedFx = {
  type: "EmitJobHttpjsonSubmittedEvent";
  eventType: "job.httpjson.submitted";
  scope: JobScope & CloudScope;
  data: JobHttpJsonData;
  traceId: string;
};

export type EmitJobMcpSubmittedFx = {
  type: "EmitJobMcpSubmittedEvent";
  eventType: "job.mcp.submitted";
  scope: JobScope & CloudScope;
  data: JobMcpData;
  traceId: string;
};
export type EmitFlowFailedFx = {
  type: "EmitFlowFailed";
  eventType: "flow.failed";
  scope: FlowScope & CloudScope;
  data: FlowFailedData;
  traceId: string;
};
export type EmitFlowCompletedFx = {
  type: "EmitFlowCompleted";
  eventType: "flow.completed";
  scope: FlowScope & CloudScope;
  data: FlowCompletedData;
  traceId: string;
};
export type WriteContextToDiskFx = {
  type: "WriteContextToDisk";
  context: RunContext;
  runId: string;
};
export type DispatchInternalFx = {
  type: "DispatchInternal";
  message: EngineMessage;
};

export type EngineEffect =
  | EmitEventFx
  | DispatchInternalFx
  | EmitRunStartedFx
  | EmitStepPlannedFx
  | EmitStepStartedFx
  | EmitStepCompletedFx
  | EmitStepFailedFx
  | EmitJoinStepStartedFx
  | EmitJobHttpJsonSubmittedFx
  | EmitJobMcpSubmittedFx
  | EmitFlowCompletedFx
  | EmitFlowFailedFx
  | WriteContextToDiskFx;

// reducers
export type Reducer<M extends EngineMessage = EngineMessage> = (
  state: EngineState,
  message: M
) => EngineState;

export type ReducerRegistry = {
  [T in EngineMessage["type"]]?: Reducer<Extract<EngineMessage, { type: T }>>;
};

// planners
export type Planner<M extends EngineMessage = EngineMessage> = (
  oldState: EngineState,
  newState: EngineState,
  message: M
) => EngineEffect[] | void;

export type PlannerRegistry = {
  [T in EngineMessage["type"]]?: Planner<Extract<EngineMessage, { type: T }>>;
};

// handlers
export type EffectHandler<T extends EngineEffect["type"]> = (
  effect: Extract<EngineEffect, { type: T }>,
  deps: EffectHandlerDeps
) => void | Promise<void>;

export type EffectHandlerRegistry = {
  [T in EngineEffect["type"]]?: (
    effect: Extract<EngineEffect, { type: T }>
  ) => void | Promise<void>;
};
export type EffectHandlerDeps = {
  queue: QueuePort;
  ef: EmitterFactoryPort;
};
