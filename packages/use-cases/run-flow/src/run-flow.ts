import { EmitterFactoryPort } from "@lcase/ports";
import { createRunId } from "./create-fork-spec.js";

export async function runFlow(
  flowDefHash: string,
  ef: EmitterFactoryPort,
  source: string,
  runId?: string,
) {
  const runid = runId ?? createRunId();
  const emitter = ef.newRunEmitterNewTrace({
    source,
    flowid: flowDefHash,
    runid,
  });
  await emitter.emit("run.requested", { flowDefHash });
}
