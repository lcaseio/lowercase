import type { ExportRef, JsonValue, Ref } from "@lcase/types";
import type { ResourceHint } from "./resource-key-resolver.js";

// Minimal, deliberately provisional -- the doc's own "Open Questions That Do
// Not Block Phase 1" leaves the final artifact/export reference shape open.
export type ArtifactRef = {
  hash: string;
};

export type HttpJsonMethod =
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

// The template shape -- ref placeholders (`{{...}}`) may still be present in
// `url`/`headers`/`body`. Deliberately not `StepHttpJson` itself: that type is
// flow-authoring-shaped (carries `on`, `exports`, routing concerns) and must
// never reach a ProtocolExecutor. `kind` (not `type`) continues the naming
// thread from `JobExecutionPort`/`ExecuteJobCommand` rather than reusing flow
// vocabulary.
export type ProtocolRequest = {
  kind: "httpjson";
  url: string;
  method?: HttpJsonMethod;
  headers?: Record<string, string>;
  body?: JsonValue;
};

export type ExecuteJobCommand = {
  executionId: string;
  jobId: string;
  runId: string;
  stepId: string;
  traceId?: string;
  protocol: ProtocolRequest;
  refs: Ref[];
  // `ExportRef` (not `ArtifactRef`) -- these are declarations of what to
  // extract, not already-resolved hashes. Matches what old worker's real
  // `storeExportArtifacts` already consumed for the same operation.
  exports?: Record<string, ExportRef>;
  resourceHint?: ResourceHint;
};

export type JobExecutionErrorCode =
  | "CANCELLED"
  | "TIMEOUT"
  | "INPUT_RESOLUTION_FAILED"
  | "HTTP_REQUEST_INVALID"
  | "HTTP_NETWORK_FAILED"
  | "HTTP_STATUS_FAILED"
  | "HTTP_RESPONSE_INVALID"
  | "OUTPUT_STORE_FAILED"
  | "EXPORT_RESOLUTION_FAILED"
  | "EXPORT_VALIDATION_FAILED"
  | "EXPORT_STORE_FAILED"
  | "RESOURCE_KEY_RESOLUTION_FAILED";

export type JobExecutionError = {
  code: JobExecutionErrorCode;
  message: string;
  retryable: boolean;
};

export type JobResult =
  | {
      status: "completed";
      executionId: string;
      jobId: string;
      output: ArtifactRef;
      exports?: Record<string, ArtifactRef>;
    }
  | {
      status: "failed";
      executionId: string;
      jobId: string;
      error: JobExecutionError;
      output?: ArtifactRef;
    };

export type JobExecutionOptions = {
  signal?: AbortSignal;
};
