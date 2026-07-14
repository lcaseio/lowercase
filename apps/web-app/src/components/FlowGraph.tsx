import type { FlowDefinition } from "@lcase/types";
import type { OutEdges } from "@lcase/types";
import { useMemo } from "react";
import { Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";

import "@xyflow/react/dist/base.css";
import { useTheme } from "@/contexts/use-theme";

// same graphLayout-based rendering as FlowEditPanel, but taking a flowDef
// directly instead of fetching by route param -- FlowTree's replacement for
// spike purposes. Likely to get replaced again once the real flow-view
// component exists.
function calcPosition(row: number, nodes: number, distance: number) {
  const offsetAmount = Math.floor(nodes / 2);
  const offsetRow = row - offsetAmount;
  return offsetRow * distance;
}

type Props = {
  flowDef: FlowDefinition;
  layout: string[][] | null;
  outEdges: OutEdges;
  onNodeClickHandler?: (node: Node) => void;
};
export function FlowGraph({
  flowDef,
  layout,
  outEdges,
  onNodeClickHandler,
}: Props) {
  const { resolvedTheme } = useTheme();

  const result = useMemo(() => {
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

        if (outEdges[node]) {
          for (const edge of outEdges[node]) {
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
  }, [flowDef, layout, outEdges]);

  return (
    <div className="h-full w-full rounded-xl">
      <ReactFlow
        nodes={result.nodes}
        edges={result.edges}
        colorMode={resolvedTheme}
        onNodeClick={
          onNodeClickHandler
            ? (_event, node) => onNodeClickHandler(node)
            : undefined
        }
        fitView
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}
