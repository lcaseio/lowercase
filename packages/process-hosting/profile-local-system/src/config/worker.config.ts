export type WorkerConfig = {
  maxConcurrentJobs: number;
  protocolTimeoutMs: number;
  // The local resource-permit adapter's own per-key concurrency limit.
  maxConcurrencyPerKey: number;
};
