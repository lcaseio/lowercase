import type { JsonValue } from "@lcase/types";
import type { JobExecutionError, ProtocolRequest } from "../job.contracts.js";

export type ProtocolResult =
  { ok: true; payload: JsonValue } | { ok: false; error: JobExecutionError };

// `execute` deliberately matches JobExecutionPort's own verb -- distinct
// types, always called through a named receiver (`protocol.execute(...)`
// vs `worker.execute(...)`), so there's no real ambiguity.
export interface ProtocolExecutor {
  execute(
    request: ProtocolRequest,
    options?: { signal?: AbortSignal },
  ): Promise<ProtocolResult>;
}
