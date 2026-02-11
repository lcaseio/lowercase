import { useMemo } from "react";
import { analyzeFlow, graphLayout, toposort } from "@lcase/flow-analysis";
import { Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";

import "@xyflow/react/dist/base.css";
import type { FlowDefinition } from "@lcase/types";
import { AutoFitView } from "./AutoFitView";

function calcPosition(row: number, nodes: number, distance: number) {
  const offsetAmount = Math.floor(nodes / 2);
  const offsetRow = row - offsetAmount;
  return offsetRow * distance;
}
type Props = {
  flowDef: FlowDefinition | null;
};
export function RunnerFlowView({ flowDef }: Props) {
  const result = useMemo(() => {
    if (!flowDef) return;
    const fa = analyzeFlow(flowDef);
    fa.toposort = toposort(fa);
    const layout = graphLayout(fa);
    if (!layout) return { nodes: [], edges: [] };

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    for (let row = 0; row < layout.length; row++) {
      for (let col = 0; col < layout[row].length; col++) {
        const node = layout[row][col];
        const x = calcPosition(col, layout[row].length, 250);

        const newNode: Node = {
          id: node,
          position: { x, y: 150 * row },
          data: { label: `${node}: ${flowDef.steps[node]?.type}` },
        };
        newNodes.push(newNode);

        if (fa.outEdges[node]) {
          for (const edge of fa.outEdges[node]) {
            const newEdge: Edge = {
              id: `${edge.startStepId}-${edge.endStepId}`,
              source: edge.startStepId,
              target: edge.endStepId,
              label: edge.gate,
            };
            newEdges.push(newEdge);
          }
        }
      }
    }
    return { nodes: newNodes, edges: newEdges };
  }, [flowDef]);

  if (!result) return <div>no nodes or edges</div>;

  return (
    <div className="w-[500px] h-[500px] rounded-xl text-sm  bg-slate-800 color-white text-slate-200 ">
      <ReactFlow nodes={result.nodes} edges={result.edges} fitView>
        <Controls />
        <AutoFitView />
      </ReactFlow>
    </div>
  );
}
