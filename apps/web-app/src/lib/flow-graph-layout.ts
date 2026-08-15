import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import type { FlowAnalysis } from "@lcase/types";

export type LayoutDirection = "TB" | "LR";
export type NodePositions = Record<
  string,
  { x: number; y: number; sourcePosition: Position; targetPosition: Position }
>;

// Today's nodes are still plain, fixed-size boxes -- no real per-node
// measurement exists yet (custom nodes are a later PR), so dagre gets a
// fixed size for every node rather than a measured one.
const NODE_WIDTH = 200;
const NODE_HEIGHT = 50;

// Mirrors graphLayout()'s own early-out (packages/flow-analysis) -- no
// toposort means a cycle was detected, nothing sensible to lay out.
export function computeDagreLayout(
  fa: FlowAnalysis,
  direction: LayoutDirection,
): NodePositions | null {
  if (!fa.toposort) return null;

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of fa.nodes) {
    g.setNode(node, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const node of fa.nodes) {
    for (const edge of fa.outEdges[node] ?? []) {
      g.setEdge(edge.startStepId, edge.endStepId);
    }
  }

  dagre.layout(g);

  // Default (plain-box) nodes render their connection handles at
  // sourcePosition/targetPosition, defaulting to Bottom/Top -- fine for a
  // vertical layout, but every edge draws top-to-bottom regardless of
  // where dagre actually placed the nodes otherwise, which looks wrong for
  // a horizontal layout. Flip to Right/Left for LR so handles land on the
  // sides the nodes are actually arranged along.
  const sourcePosition = direction === "LR" ? Position.Right : Position.Bottom;
  const targetPosition = direction === "LR" ? Position.Left : Position.Top;

  // dagre's own {x,y} is each node's center; React Flow's `position` is
  // top-left -- offset by half the fixed size above to convert.
  const positions: NodePositions = {};
  for (const node of fa.nodes) {
    const { x, y } = g.node(node);
    positions[node] = {
      x: x - NODE_WIDTH / 2,
      y: y - NODE_HEIGHT / 2,
      sourcePosition,
      targetPosition,
    };
  }
  return positions;
}
