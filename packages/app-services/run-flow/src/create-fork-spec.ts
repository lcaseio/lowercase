import { ForkSpec } from "@lcase/types";
import type {
  ArtifactsPort,
  EmitterFactoryPort,
  EventBusPort,
} from "@lcase/ports";
import { randomUUID } from "node:crypto";
export function createForkSpec(steps: string[], runId: string) {
  const forkSpec: ForkSpec = {
    parentRunId: runId,
    reuse: steps,
  };
  return forkSpec;
}

type RunForkedSimDeps = {
  ef: EmitterFactoryPort;
  bus: EventBusPort;
  artifacts: ArtifactsPort;
};
export async function runForkedSim(
  flowDefHash: string,
  parentRunId: string,
  reuseSteps: string[],
  source: string,
  deps: RunForkedSimDeps,
) {
  const forkSpec = createForkSpec(reuseSteps, parentRunId);
  const runId = createRunId();
  const emitter = deps.ef.newRunEmitterNewTrace({
    source,
    flowid: flowDefHash,
    runid: runId,
  });

  const forkSpecResult = await deps.artifacts.putJson(forkSpec);
  if (!forkSpecResult.ok) {
    console.log("Error storing fork spec");
    console.log(forkSpecResult.error);
    return;
  }

  console.log("fork spec", forkSpec);
  const event = await emitter.emit("run.requested", {
    flowDefHash,
    forkSpecHash: forkSpecResult.value,
  });
  console.log(event.data);
}

export function createRunId(): string {
  const uuid = randomUUID();
  return `run-${uuid}`;
}
