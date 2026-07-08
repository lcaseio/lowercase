import type {
  ServerControllerPort,
  EventSink,
  RuntimeStatus,
} from "@lcase/ports";
import { WorkflowRuntime } from "@lcase/runtime";

export class WorkflowController implements ServerControllerPort {
  constructor(private readonly runtime: WorkflowRuntime) {}

  async startRuntime(): Promise<RuntimeStatus> {
    return await this.runtime.startRuntime();
  }
  async stopRuntime(): Promise<RuntimeStatus> {
    return await this.runtime.stopRuntime();
  }
  attachSink(sink: EventSink) {
    this.runtime.attachSink(sink);
  }

  async replayRun(runId: string) {
    await this.runtime.replay.replayRun(runId);
  }
}
