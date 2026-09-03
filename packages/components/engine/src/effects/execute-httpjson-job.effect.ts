import { buildEvent, publishEvent } from "@lcase/events";
import type { JobCompletedData, JobFailedData } from "@lcase/types";
import type { JobExecutionOutcome } from "@lcase/ports/engine";
import type {
  EffectHandler,
  EffectHandlerDeps,
  ExecuteHttpJsonJobFx,
  JobFinishedMsg,
} from "../engine.types.js";

// Worker V2 plan Phase 4: calls the engine-owned JobExecutorPort directly and
// advances the run from its returned result, instead of waiting on a
// job.httpjson.completed bus event. JobFinishedMsg's shape stays exactly as
// today (a real AnyEvent) so the existing reducer/planner need no changes --
// a deliberately minimal engine change, not the full engine refactor this
// work gave the worker.
//
// The synthetic event built below is used twice: once to feed JobFinishedMsg
// for the engine's own internal progression, and once published on the bus
// so the event log/UI graph still see job.httpjson.completed/.failed -- the
// same reasoning that keeps EmitJobHttpJsonSubmittedFx's bus publish alive
// unchanged. Not published by LocalWorkerJobExecutor itself (packages/
// integrations' engine-worker subpath) -- that adapter is a pure translator
// with no bus dependency; this effect already builds the AnyEvent it needs
// for JobFinishedMsg, so publishing the same object here is the smallest
// addition, not a second responsibility bolted onto the adapter.
export const executeHttpJsonJobFx: EffectHandler<"ExecuteHttpJsonJob"> = async (
  effect: ExecuteHttpJsonJobFx,
  deps: EffectHandlerDeps,
) => {
  const outcome = await deps.jobExecutor.execute(effect.request);

  const emitOptions = {
    ...effect.scope,
    source: deps.source,
    traceId: effect.traceId,
  };
  // Built per-branch, not via a shared union-typed `type`/`data` pair --
  // buildEvent's generic can't correlate a union type with a union data
  // shape across a function-call boundary, so narrowing inside each branch
  // avoids needing a cast (the compatibility mapper hit the same limitation
  // and uses a documented cast instead).
  const event =
    outcome.status === "completed"
      ? buildEvent(
          "job.httpjson.completed",
          toJobCompletedData(outcome),
          emitOptions,
        )
      : buildEvent(
          "job.httpjson.failed",
          toJobFailedData(outcome),
          emitOptions,
        );

  deps.enqueue({ type: "JobFinished", event } satisfies JobFinishedMsg);
  deps.processAll();

  await publishEvent(deps.bus, event);
};

// Mirrors the shape of the related change toCompatibilityCompletedData/
// toCompatibilityFailedData (legacy-httpjson-job.mapper.ts), but not shared
// code with it -- that pair translates from worker's own JobResult, this one
// translates from JobExecutionOutcome (engine's own port vocabulary,
// deliberately not worker's type). Same logic, different input type.
function toJobCompletedData(
  outcome: Extract<JobExecutionOutcome, { status: "completed" }>,
): JobCompletedData {
  const exportEntries = Object.entries(outcome.exports ?? {});
  const exportHashes =
    exportEntries.length > 0
      ? Object.fromEntries(exportEntries.map(([name, ref]) => [name, ref.hash]))
      : undefined;
  return {
    status: "success",
    output: outcome.output.hash,
    ...(exportHashes ? { exportHashes } : {}),
  };
}

function toJobFailedData(
  outcome: Extract<JobExecutionOutcome, { status: "failed" }>,
): JobFailedData {
  return {
    status: "failure",
    output: outcome.output ? outcome.output.hash : null,
    message: outcome.error.message,
  };
}
