import type { ArtifactStoreConfig } from "./artifact-store.config.js";
import type { WorkerConfig } from "./worker.config.js";
import type { ObservabilityConfig } from "./observability.config.js";
import type { LimiterConfig } from "./limiter.config.js";
import type { SqlConfig } from "./sql.config.js";
import type { MessagingConfig } from "./messaging.config.js";

export type LocalSystemConfig = {
  artifacts: ArtifactStoreConfig;
  worker: WorkerConfig;
  observability: ObservabilityConfig;
  limiter: LimiterConfig;
  sql: SqlConfig;
  messaging: MessagingConfig;
};
