import { EmitterFactoryPort, RunRequest } from "@lcase/ports";
import { createRunId } from "./create-fork-spec.js";

export type RunDetails = {
  ef: EmitterFactoryPort;
} & RunRequest;
export async function runFlow(runDetails: RunDetails) {
  const {
    runId,
    ef,
    source,
    flowId,
    flowVersionId,
    flowDefHash,
    simId,
    forkSpecHash,
    params,
  } = runDetails;
  const runid = runId ?? createRunId();
  const emitter = ef.newRunEmitterNewTrace({
    source,
    flowid: flowDefHash,
    runid,
  });
  await emitter.emit("run.requested", {
    flowId,
    flowVersionId,
    flowDefHash,
    ...(simId ? { simId } : {}),
    ...(forkSpecHash ? { forkSpecHash } : {}),
    ...(params ? { params } : {}),
  });
}
