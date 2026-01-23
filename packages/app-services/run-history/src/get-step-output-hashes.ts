import type { RunIndexStorePort } from "@lcase/ports";

type RunId = string;
type OutputHash = string;

/**
 * Gets the output hashes for a list of steps.
 * @param stepIds array of step ids to get output hashes from
 * @param runId run id string of the run
 * @param store store implementation for retrieving the run index
 * @returns Record<string, string> ( runId -> outputHash map )
 */
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
