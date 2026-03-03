import { FlowAnalysis } from "@lcase/types";
/**
 * Uses a flow analysis to generate a toposort array of node ids.
 * @param fa FlowAnalysis object
 * @returns string[] of node ids
 */
export function toposort(fa: FlowAnalysis): string[] {
  const inDegreeMap = new Map<string, number>();

  const queue: string[] = [];
  for (const node of fa.nodes) {
    const inDegree = fa.inEdges[node]?.length ?? 0;
    inDegreeMap.set(node, inDegree);
    if (inDegree === 0) queue.push(node);
  }

  const toposort: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    toposort.push(node);

    if (fa.outEdges[node] === undefined) continue;

    for (const edge of fa.outEdges[node]) {
      console.log(edge);
      const currentInEdges = inDegreeMap.get(edge.endStepId)!;
      const remainingInEdges = currentInEdges - 1;
      inDegreeMap.set(edge.endStepId, remainingInEdges);
      if (remainingInEdges === 0) queue.push(edge.endStepId);
    }
  }

  if (toposort.length !== fa.nodes.length) {
    throw new Error("Cycle detected");
  }
  return toposort;
}
