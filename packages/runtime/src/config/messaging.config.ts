// Single-variant placeholder -- direct in-process job execution (engine
// calls the worker's JobExecutorPort directly) is the only real backend
// today. the related change adds a "redis-streams" branch.
export type MessagingConfig = { kind: "direct" };
