import { useParams } from "react-router-dom";
import { useGetFlowDefQuery } from "../redux/api/flows-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo } from "react";
import { analyzeFlow, graphLayout, toposort } from "@lcase/flow-analysis";
import { Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";

import "@xyflow/react/dist/base.css";
import { useTheme } from "@/contexts/use-theme";

function calcPosition(row: number, nodes: number, distance: number) {
  const offsetAmount = Math.floor(nodes / 2);
  const offsetRow = row - offsetAmount;
  return offsetRow * distance;
}

export function FlowEditPanel() {
  const { resolvedTheme } = useTheme();
  const { flowId } = useParams<{ flowId: string }>();
  const { data } = useGetFlowDefQuery(flowId ?? skipToken);

  const result = useMemo(() => {
    if (!data || data.ok === false) return;
    const fa = analyzeFlow(data.value);
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
          data: { label: `${node}: ${data.value.steps[node]?.type}` },
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
  }, [data]);

  if (!result) return <div>no nodes or edges</div>;

  return (
    <div className="w-12/12 h-[800px] rounded-xl">
      <ReactFlow
        nodes={result.nodes}
        edges={result.edges}
        colorMode={resolvedTheme}
        fitView
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}
