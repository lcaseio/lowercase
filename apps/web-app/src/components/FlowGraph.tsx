import type { FlowDefinition } from "@lcase/types";
import type { OutEdges } from "@lcase/types";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Controls,
  Panel,
  ReactFlow,
  type Edge,
  type Node,
  type Position,
} from "@xyflow/react";

import "@xyflow/react/dist/base.css";
import { useTheme } from "@/contexts/use-theme";
import type { StepRunInfo, StepStatus } from "@/hooks/use-step-run-info";

// Set via inline style, not a Tailwind className: @xyflow/react/dist/style.css
// sets `border` on `.react-flow__node-default` as plain, un-layered CSS, which
// always beats a Tailwind utility class (Tailwind wraps its utilities in
// `@layer utilities`, and any un-layered rule beats any layered rule
// regardless of specificity or source order). Inline style has no such fight.
function statusNodeStyle(status: StepStatus | undefined): {
  className?: string;
  style?: { border: string };
} {
  switch (status) {
    case "running":
      return {
        className: "animate-step-pulse",
        style: { border: "2px solid var(--color-amber-500, #f59e0b)" },
      };
    case "completed":
      return { style: { border: "2px solid #34d399" } };
    case "failed":
      return { style: { border: "2px solid #d3344a" } };
    case "initialized":
    default:
      return {};
  }
}

type Props = {
  flowDef: FlowDefinition;
  layout: Record<
    string,
    { x: number; y: number; sourcePosition: Position; targetPosition: Position }
  > | null;
  outEdges: OutEdges;
  onNodeClickHandler?: (node: Node) => void;
  stepRunInfo?: Record<string, StepRunInfo>;
  reusedStepIds?: string[];
  toolbar?: ReactNode;
  authoringBar?: ReactNode;
};
export function FlowGraph({
  flowDef,
  layout,
  outEdges,
  onNodeClickHandler,
  stepRunInfo,
  reusedStepIds,
  toolbar,
  authoringBar,
}: Props) {
  const { resolvedTheme } = useTheme();

  const graph = useMemo(() => {
    if (!layout) return { nodes: [], edges: [] };

    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];
    for (const [node, layoutData] of Object.entries(layout)) {
      const { x, y, sourcePosition, targetPosition } = layoutData;
      const status = stepRunInfo?.[node]?.status;
      const { className, style } = statusNodeStyle(status);
      const reusedPrefix = reusedStepIds?.includes(node) ? "↺ " : "";

      const graphNode: Node = {
        id: node,
        position: { x, y },
        sourcePosition,
        targetPosition,
        data: {
          label: `${reusedPrefix}${node}: ${flowDef.steps[node]?.type}`,
          status,
        },
        ...(className ? { className } : {}),
        ...(style ? { style } : {}),
      };
      graphNodes.push(graphNode);

      if (outEdges[node]) {
        // a branch step can route multiple distinct cases to the same next
        // step -- drawing one edge per case would visually overlap (React
        // Flow has no built-in way to spread edges that share both
        // endpoints apart), so edges to the same target are combined into
        // one, with each case/gate joined into a single label instead.
        const labelsByTarget = new Map<string, string[]>();
        for (const edge of outEdges[node]) {
          const branchCase =
            edge.caseValue ?? (edge.isDefault ? "default" : undefined);
          const label = branchCase ?? edge.gate;
          const labels = labelsByTarget.get(edge.endStepId) ?? [];
          labels.push(label);
          labelsByTarget.set(edge.endStepId, labels);
        }
        for (const [target, labels] of labelsByTarget) {
          const graphEdge: Edge = {
            id: `${node}-${target}`,
            source: node,
            target,
            label: labels.join(" / "),
          };
          graphEdges.push(graphEdge);
        }
      }
    }
    return { nodes: graphNodes, edges: graphEdges };
  }, [flowDef, layout, outEdges, stepRunInfo, reusedStepIds]);

  return (
    <div className="h-full w-full rounded-xl">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        colorMode={resolvedTheme}
        onNodeClick={
          onNodeClickHandler
            ? (_event, node) => onNodeClickHandler(node)
            : undefined
        }
        fitView
        fitViewOptions={{ padding: 0.5 }}
      >
        <Controls />
        {authoringBar && <Panel position="top-center">{authoringBar}</Panel>}
        {toolbar && <Panel position="bottom-center">{toolbar}</Panel>}
      </ReactFlow>
    </div>
  );
}
