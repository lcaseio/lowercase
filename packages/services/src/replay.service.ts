import { ReplayEnginePort } from "@lcase/ports/replay";
export class ReplayService {
  constructor(private replay: ReplayEnginePort) {}

  async replayRun(runId: string) {
    await this.replay.emitReplayMode(runId, false);
    await this.replay.replayAllEvents(runId);
  }
}
