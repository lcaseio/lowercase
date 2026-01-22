import type { RunIndex, RunIndexStorePort } from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";
import fs, { WriteStream } from "node:fs";
import path from "node:path";

type RunId = string;
type RunScopedEvent = AnyEvent & { runid: string };

type ProcessedEvent =
  | AnyEvent<"run.requested">
  | AnyEvent<"run.started">
  | AnyEvent<"run.completed">
  | AnyEvent<"run.failed">
  | AnyEvent<"step.started">
  | AnyEvent<"step.completed">
  | AnyEvent<"step.failed">;

export class FsRunIndexStore implements RunIndexStorePort {
  private runIndexes = new Map<RunId, RunIndex>();
  constructor(public dir: string) {
    if (!path.isAbsolute(dir)) {
      throw new Error(`[fs-run-index-store] dir must be absolute: ${dir}`);
    }
    if (fs.existsSync(dir))
      fs.mkdirSync(path.dirname(dir), { recursive: true });
  }

  async processEvent(event: AnyEvent): Promise<void> {
    if (!this.hasRunId(event)) return;

    switch (event.type) {
      case "run.requested":
        this.processRunRequested(event as AnyEvent<"run.requested">);
        break;
      case "run.started":
        this.processRunStarted(event as AnyEvent<"run.started">);
        break;
      case "run.completed":
        this.processRunFinished(event as AnyEvent<"run.completed">);
        break;
      case "run.failed":
        this.processRunFinished(event as AnyEvent<"run.failed">);
        break;
      case "step.started":
        this.processStepStarted(event as AnyEvent<"step.started">);
        break;
      case "step.completed":
        this.processStepFinished(event as AnyEvent<"step.completed">);
        break;
      case "step.failed":
        this.processStepFinished(event as AnyEvent<"step.failed">);
        break;
      default:
        break;
    }
  }

  initRunIndex(event: ProcessedEvent): RunIndex {
    const index: RunIndex = {
      flowId: event.flowid,
      traceId: event.traceid,
      steps: {},
    };
    this.runIndexes.set(event.runid, index);
    return index;
  }

  getIndex(event: ProcessedEvent) {
    return this.runIndexes.get(event.runid) ?? this.initRunIndex(event);
  }

  processRunRequested(event: AnyEvent<"run.requested">) {
    const index = this.getIndex(event);
    index.flowDefHash = event.data.flowDefHash;
    index.forkSpecHash = event.data.forkSpecHash;
  }
  processRunStarted(event: AnyEvent<"run.started">): void {
    const index = this.getIndex(event);
    index.startTime = event.time;
  }
  processRunFinished(
    event: AnyEvent<"run.completed"> | AnyEvent<"run.failed">,
  ): void {
    const index = this.getIndex(event);
    index.endTime = event.time;
    index.duration = this.getDuration(index.startTime, index.endTime);
  }
  processStepStarted(event: AnyEvent<"step.started">): void {
    const index = this.getIndex(event);
    index.steps[event.stepid].startTime = event.time;
    index.steps[event.stepid].status = event.data.status;
  }
  processStepFinished(
    event: AnyEvent<"step.completed"> | AnyEvent<"step.failed">,
  ): void {
    const step = this.getIndex(event).steps[event.stepid];
    step.endTime = event.time;
    step.outputHash = event.data.outputHash;
    step.status = event.data.status;
    step.duration = this.getDuration(step.startTime, step.endTime);
  }

  hasRunId(event: AnyEvent): event is RunScopedEvent {
    const e = event as unknown as Record<string, unknown>;
    return typeof e.runid === "string";
  }

  getDuration(
    startTime: string | undefined,
    endTime: string | undefined,
  ): number | undefined {
    if (startTime === undefined || endTime === undefined) return;
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const duration = endDate.getTime() - startDate.getTime();
    if (Number.isNaN(duration)) return;

    return Math.abs(duration) / 1000;
  }
}
