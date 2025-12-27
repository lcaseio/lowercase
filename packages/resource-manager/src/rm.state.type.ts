import type {
  EmitterFactoryPort,
  EventBusPort,
  JobCompletedParsed,
  JobFailedParsed,
  JobParserPort,
  JobSubmittedParsed,
  QueuePort,
} from "@lcase/ports";
import type { CapId, ToolSpec } from "@lcase/types";

export type ResourceManagerDeps = {
  ef: EmitterFactoryPort;
  queue: QueuePort;
  jobParser: JobParserPort;
  bus: EventBusPort;
};

export type CapRegisteredToolsMap = {
  [T in CapId]?: Set<string>;
};

export type JobParsedAny =
  | JobSubmittedParsed
  | JobCompletedParsed
  | JobFailedParsed;

type ActiveJobsPerTool = {
  [t in string]: number;
};
type ToolId = string;
type WorkerId = string;
type JobId = string;
type RunId = string;

type WorkerRegistryEntry = {
  canRunTools: Record<ToolId, true>;
  name: string;
  type: "internal" | "external";
  status: "online" | "offline";
};

type JobEntry = {
  jobId: JobId;
  toolId: ToolId;
  runId: RunId;
  capId: CapId;
};

// tool is global across all runs per tool
export type ToolRuntime = {
  activeJobCount: number;

  running: Record<JobId, JobEntry>;
  queued: Record<JobId, JobEntry>;
  delayed: Record<JobId, JobEntry>;
  pendingQueued: Record<JobId, JobEntry>;
  pendingQueuedCount: number;
  pendingDelayed: Record<JobId, JobEntry>;
  pendingDelayedCount: number;
};

// state per run for replay
export type RunRuntime = {
  jobToolMap: Record<JobId, ToolId>;
  activeJobsPerToolCount: Record<ToolId, number>;
  running: Record<JobId, JobEntry>;
  queued: Record<JobId, JobEntry>;
  delayed: Record<JobId, JobEntry>;
  pendingQueued: Record<JobId, JobEntry>;
  pendingQueuedCount: number;
  pendingDelayed: Record<JobId, JobEntry>;
  pendingDelayedCount: number;
};

export type RmState = {
  policy: RmPolicyState;
  registry: {
    tools: Record<ToolId, ToolSpec & { hasOnlineWorker: boolean }>;
    workers: Record<WorkerId, WorkerRegistryEntry>;
  };
  runtime: {
    perTool: Record<ToolId, ToolRuntime>;
    perRun: Record<RunId, RunRuntime>;
  };
};
export type RmPolicyState = {
  defaultToolMap: Record<CapId, string>;
};
