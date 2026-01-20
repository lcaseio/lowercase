export interface ReplayEnginePort {
  replayAllEvents(runId: string): Promise<void>;
  emitReplayMode(runId: string, enableSideEffects: boolean): Promise<void>;
}
