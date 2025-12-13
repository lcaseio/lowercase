export interface ReplayEnginePort {
  replayAllEvents(runId: string): Promise<void>;
}
