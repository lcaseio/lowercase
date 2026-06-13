import type { IndexStorePort } from "@lcase/ports";
import type { FlowIndex, RunIndex, RunListItem } from "@lcase/types";

export async function listAllRuns(
  store: IndexStorePort<RunIndex>,
  flowStore: IndexStorePort<FlowIndex>,
) {
  const runList: RunListItem[] = [];

  const runIds = await store.getIdList();
  for (const runId of runIds) {
    const runIndex = await store.get(runId);
    if (!runIndex) continue;
    if (!runIndex.flowDefHash) continue;

    // const flowIndexResult = await flowStore.getFlowIndex(runIndex.flowDefHash);
    const flowIndexResult = await flowStore.get(runIndex.flowDefHash);

    if (!flowIndexResult) continue;
    runList.push({
      runId,
      flowName: flowIndexResult.name,
      flowVersion: flowIndexResult.version,
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
