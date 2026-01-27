export interface WorkerPort {
  start(): Promise<void>;
  stop(): Promise<void>;
  stopAllJobWaiters(): Promise<void>;
}
