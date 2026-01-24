import type {
  AnyEvent,
  FlowDefinition,
  ForkSpec,
  RunIndex,
} from "@lcase/types";

export type StepPlannedMsg = {
  type: "StepPlanned";
  event: AnyEvent<"step.planned">;
};
export type StepStartedMsg = {
  type: "StepStarted";
  event: AnyEvent<"step.started">;
};

export type StepFinishedMsg = {
  type: "StepFinished";
  event: AnyEvent<"step.completed"> | AnyEvent<"step.failed">;
};
export type RunRequestedMsg = {
  type: "RunRequested";
  event: AnyEvent<"run.requested">;
};
export type FlowDefResultMsg =
  | {
      type: "FlowDefResult";
      runId: string;
      ok: true;
      def: FlowDefinition;
    }
  | { type: "FlowDefResult"; runId: string; ok: false; error: string };

export type ForkSpecResultMsg =
  | {
      type: "FlowSpecResult";
      runId: string;
      ok: true;
      forkSpec: ForkSpec;
    }
  | { type: "FlowSpecResult"; runId: string; ok: false; error: string };

export type RunIndexResultMsg =
  | {
      type: "RunIndexResult";
      runId: string;
      ok: true;
      runIndex: RunIndex;
    }
  | { type: "RunIndexResult"; runId: string; ok: false; error: string };

export type MakeRunPlanMsg = {
  type: "MakeRunPlan";
  runId: string;
};
