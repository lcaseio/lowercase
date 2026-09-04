// Single-variant placeholder -- direct in-process job execution (the engine
// calls the worker's JobExecutionPort directly) is the only real backend
// today. A later change adds a "redis-streams" branch.
export type MessagingConfig = { kind: "direct" };
