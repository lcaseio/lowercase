import type { FlowDefinition } from "@lcase/types";
import { analyzeFlow } from "@lcase/flow-analysis";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";

const initialNodes = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];
export function FlowTree({ flowDef }: { flowDef: FlowDefinition }) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const handleReload = () => {
    const fa = analyzeFlow(flowDef);
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let count = 0;
    for (const node of fa.nodes) {
      const newNode: Node = {
        id: node,
        position: { x: 0, y: 100 * count },
        data: { label: `${node}: ${flowDef.steps[node]?.type}` },
      };
      newNodes.push(newNode);

      if (fa.outEdges[node]) {
        console.log("edges");
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
      count++;
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  return (
    <div className="w-[500px] h-[500px] rounded-xl bg-slate-800 text-slate-900">
      <h3>Flow Tree</h3>
      <button onClick={handleReload}>Reload</button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
