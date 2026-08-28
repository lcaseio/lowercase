import type {
  AnyEvent,
  JobCompletedData,
  JobFailedData,
  JsonValue,
} from "@lcase/types";
import type { EmitOptions } from "@lcase/events";
import type { ExecuteJobCommand, JobResult } from "../../job.contracts.js";

export function toExecuteJobCommand(
  event: AnyEvent<"job.httpjson.queued">,
): ExecuteJobCommand {
  const { url, method, headers, body, refs, exportRefs } = event.data;
  return {
    // No retry loop exists on this compat path yet -- one queued job is
    // always exactly one execution attempt, so reusing jobId here is a
    // temporary mapping, not a decision that executionId should permanently
    // equal jobId long-term.
    executionId: event.jobid,
    jobId: event.jobid,
    runId: event.runid,
    stepId: event.stepid,
    traceId: event.traceid,
    protocol: {
      kind: "httpjson",
      url,
      method,
      headers,
      // ShallowJsonValue -> JsonValue: correct by construction (a step's
      // body is only ever JSON.parse'd/authored JSON), but not structurally
      // assignable -- same precedent as materialize-http-json-request.ts.
      ...(body !== undefined ? { body: body as JsonValue } : {}),
    },
    refs,
    exports: exportRefs,
  };
}

export function toCompatibilityCompletedData(
  result: Extract<JobResult, { status: "completed" }>,
): JobCompletedData {
  const exportEntries = Object.entries(result.exports ?? {});
  const exportHashes =
    exportEntries.length > 0
      ? Object.fromEntries(exportEntries.map(([name, ref]) => [name, ref.hash]))
      : undefined;
  return {
    status: "success",
    output: result.output.hash,
    ...(exportHashes ? { exportHashes } : {}),
  };
}

export function toCompatibilityFailedData(
  result: Extract<JobResult, { status: "failed" }>,
): JobFailedData {
  return {
    status: "failure",
    output: result.output ? result.output.hash : null,
    message: result.error.message,
  };
}

export function toEmitOptions(
  event: AnyEvent<"job.httpjson.queued">,
  source: string,
): EmitOptions<"job.httpjson.completed" | "job.httpjson.failed"> {
  return {
    flowid: event.flowid,
    flowversionid: event.flowversionid,
    runid: event.runid,
    stepid: event.stepid,
    jobid: event.jobid,
    capid: event.capid,
    toolid: event.toolid,
    source,
    fromEvent: event,
  };
}
