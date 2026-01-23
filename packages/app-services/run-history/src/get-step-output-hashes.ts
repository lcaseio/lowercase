import type { RunIndexStorePort } from "@lcase/ports";

type RunId = string;
type OutputHash = string;

export async function getStepOutputHashes(
  stepIds: string[],
  runId: string,
  store: RunIndexStorePort,
): Promise<Record<RunId, OutputHash> | undefined> {
  const json = await store.getRunIndex(runId);
  if (!json) return;

  const hashMap: Record<RunId, OutputHash> = {};

  for (const stepId of stepIds) {
    const step = json.steps[stepId];
    if (!step) return;
    if (step.outputHash) hashMap[stepId] = step.outputHash;
  }
  return hashMap;
}
