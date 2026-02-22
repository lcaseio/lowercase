import { FlowIndexStorePort, RunIndexStorePort } from "@lcase/ports";
import type { RunListItem } from "@lcase/types";

export async function listAllRuns(
  store: RunIndexStorePort,
  flowStore: FlowIndexStorePort,
) {
  const runList: RunListItem[] = [];

  const runIds = await store.getAllRunIds();
  for (const runId of runIds) {
    const runIndex = await store.getRunIndex(runId);
    if (!runIndex) continue;
    if (!runIndex.flowDefHash) continue;

    const flowIndexResult = await flowStore.getFlowIndex(runIndex.flowDefHash);
    if (!flowIndexResult.ok) continue;
    runList.push({
      runId,
      flowName: flowIndexResult.value.name,
      flowVersion: flowIndexResult.value.version,
      flowDefHash: runIndex.flowDefHash,
      forkSpecHash: runIndex.forkSpecHash,
      startTime: runIndex.startTime,
      endTime: runIndex.endTime,
      duration: runIndex.duration,
      parentId: runIndex.parentId,
    });
  }
  return runList;
}
