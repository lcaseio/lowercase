import { useMemo } from "react";
import { analyzeFlow, graphLayout, toposort } from "@lcase/flow-analysis";
import {
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";

import "@xyflow/react/dist/base.css";
import type { FlowDefinition } from "@lcase/types";
import { AutoFitView } from "../AutoFitView";
import { useTheme } from "@/contexts/use-theme";
import { useAppSelector } from "@/redux/typed-hooks";
import {
  addReusedStepId,
  removeReusedStepId,
  selectReusedSteps,
} from "@/redux/slices/sims-slice";
import { useDispatch } from "react-redux";
import clsx from "clsx";

function calcPosition(row: number, nodes: number, distance: number) {
  const offsetAmount = Math.floor(nodes / 2);
  const offsetRow = row - offsetAmount;
  return offsetRow * distance;
}
type Props = {
  flowDef: FlowDefinition | null;
};
export function SimsFlowView({ flowDef }: Props) {
  const { resolvedTheme } = useTheme();
  const dispatch = useDispatch();
  const reusedSteps = useAppSelector(selectReusedSteps);
  const selectedFlowId = useAppSelector((state) => state.sims.flowSelectedId);
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

        const stepId = selectedFlowId
          ? reusedSteps[selectedFlowId]?.[node]
          : false;

        const newNode: Node = {
          id: node,
          position: { x, y: 150 * row },
          data: { label: `${node}: ${flowDef.steps[node]?.type}` },
          className: clsx("cursor-default"),
          style: {
            background: stepId ? "#4d776e" : "",
            outline: "blue 5px",
            color:
              resolvedTheme === "light" && stepId
                ? "var(--background)"
                : "var(--forground)",
          },
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
  }, [flowDef, reusedSteps, resolvedTheme, selectedFlowId]);

  if (!result) return <div>no nodes or edges</div>;

  const handleNodeClick: NodeMouseHandler = (event, node) => {
    console.log("event", event);
    console.log("node", node);
    if (!selectedFlowId) return;
    if (reusedSteps[selectedFlowId]?.[node.id]) {
      dispatch(removeReusedStepId({ flowId: selectedFlowId, stepId: node.id }));
    } else
      dispatch(addReusedStepId({ flowId: selectedFlowId, stepId: node.id }));
  };

  return (
    <div className="w-12/12 h-[800px]  rounded-xl text-sm  bg-background text-foreground color-black">
      <ReactFlow
        nodes={result.nodes}
        edges={result.edges}
        fitView
        colorMode={resolvedTheme}
        onNodeClick={handleNodeClick}
      >
        <Controls />
        <AutoFitView />
      </ReactFlow>
    </div>
  );
}
