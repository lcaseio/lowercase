import { EmitterFactoryPort, RunRequest } from "@lcase/ports";
import { createRunId } from "./create-fork-spec.js";

export type RunDetails = {
  ef: EmitterFactoryPort;
} & RunRequest;
export async function runFlow(runDetails: RunDetails) {
  const { runId, ef, source, flowDefHash, forkSpecHash, params } = runDetails;
  const runid = runId ?? createRunId();
  const emitter = ef.newRunEmitterNewTrace({
    source,
    flowid: flowDefHash,
    runid,
  });
  await emitter.emit("run.requested", {
    flowDefHash,
    ...(forkSpecHash ? { forkSpecHash } : {}),
    ...(params ? { params } : {}),
  });
}
