import type { FlowDefinition } from "@lcase/types";
import type { EventSink } from "../observability/observability-sink.port.js";
import type { RuntimeStatus } from "../controller.port.js";
import type { FlowList } from "../flow/list.type.js";

export interface ServicesPort {
  flow: FlowServicePort;
  sim: SimServicePort;
  replay: ReplayServicePort;
  system: SystemServicePort;
  run: RunServicePort;
}

export interface SimServicePort {
  startForkedRunSim(
    parentRunId: string,
    reuseSteps: string[],
    source: string,
  ): Promise<void>;
}

export interface FlowServicePort {
  startFlow(args: { absoluteFilePath?: string }): Promise<void>;
  listFlows(args: { absoluteDirPath?: string }): Promise<FlowList>;
  validateJsonFlow(blob: unknown): FlowDefinition | string;
}
export interface ReplayServicePort {
  replayRun(runId: string): Promise<void>;
}

export interface SystemServicePort {
  startSystem(): Promise<RuntimeStatus>;
  stopSystem(): Promise<RuntimeStatus>;
  attachSink(sink: EventSink): void;
}

export interface RunServicePort {
  requestRun(flowDefHash: string, source: string): Promise<void>;
}
