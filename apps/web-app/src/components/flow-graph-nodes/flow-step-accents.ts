import type { Edge, StepDefinition } from "@lcase/types";
import type { StepStatus } from "@/hooks/use-step-run-info";

export type FlowStepAccent = {
  label: string;
  colorClassName: string;
};

// Only httpjson has a custom node so far (mcp is functionally semi-dead,
// branch/join/parallel keep rendering as plain default nodes) -- add an
// entry here when a step type gets its own FlowStepNode variant.
const FLOW_STEP_ACCENTS: Partial<
  Record<StepDefinition["type"], FlowStepAccent>
> = {
  httpjson: { label: "httpjson", colorClassName: "bg-sky-800" },
};

export function getFlowStepAccent(
  type: StepDefinition["type"] | undefined,
): FlowStepAccent | undefined {
  return type ? FLOW_STEP_ACCENTS[type] : undefined;
}

// Same green/red already used for step/run status elsewhere (FlowGraph.tsx's
// statusNodeStyle, EventGraph.tsx, EvalScoreChart.tsx) -- shared here too so
// a gate's handle color can't drift from what "success"/"failure" already
// look like everywhere else.
export const GATE_SUCCESS_COLOR = "#34d399";
export const GATE_FAILURE_COLOR = "#d3344a";

// Shared so the handle color (FlowStepNode.tsx) and the edge line color
// (FlowGraph.tsx) that leaves it can't drift apart from each other.
//
// Only "control" edges (httpjson/mcp's own on.success/on.failure wiring,
// packages/flow-analysis's addCapEdges) are genuinely conditional on
// success/failure. Other edge types can also leave an httpjson step --
// notably "join" edges (gate "always", from addJoinEdges) when that step is
// also listed as one of a join's inputs, which isn't part of the on-field
// model at all. Treating "always" as "not onSuccess, therefore failure"
// colored those edges/handles red for no real reason. Returns undefined for
// anything that isn't a real success/failure branch, so callers fall back
// to their default (unstyled) color instead of a wrong one.
export function getGateColor(edge: Edge): string | undefined {
  if (edge.type !== "control") return undefined;
  return edge.gate === "onSuccess" ? GATE_SUCCESS_COLOR : GATE_FAILURE_COLOR;
}

// A completed/failed node's border and its own onSuccess/onFailure edge
// share the same green/red -- fine on its own, but the two edges out of a
// node with both wired otherwise look identical regardless of which one a
// run actually took. There's no separate "which edge fired" data to track
// though: for a control edge, the gate and the source step's resolved
// status are the same fact (completed took onSuccess, failed took
// onFailure, if wired). So the taken edge gets bolder, its untaken sibling
// fades -- only once status has actually resolved; while running or absent,
// neither edge is "confirmed" yet, so both keep today's plain gate color.
const TAKEN_EDGE_STROKE_WIDTH = 3;
const UNTAKEN_EDGE_OPACITY = 0.35;

export function getEdgeStyle(
  edge: Edge,
  sourceStatus: StepStatus | undefined,
): { stroke?: string; strokeWidth?: number; opacity?: number } {
  const stroke = getGateColor(edge);
  const resolved = sourceStatus === "completed" || sourceStatus === "failed";
  if (edge.type !== "control" || !stroke || !resolved) return { stroke };

  const taken =
    (sourceStatus === "completed" && edge.gate === "onSuccess") ||
    (sourceStatus === "failed" && edge.gate === "onFailure");
  return taken
    ? { stroke, strokeWidth: TAKEN_EDGE_STROKE_WIDTH }
    : { stroke, opacity: UNTAKEN_EDGE_OPACITY };
}

// Same amber already used for a running step's outline (FlowGraph.tsx's
// statusNodeStyle) -- shared here too, same drift-avoidance reasoning as the
// gate colors above.
export const STATUS_RUNNING_COLOR = "var(--color-amber-500, #f59e0b)";

// Deliberately its own hue, outside the green/amber/red palette status and
// gate colors already claim -- blue is the conventional "this is selected"
// color in most editors, so it reads as a distinct kind of signal rather
// than competing with either of those for the same visual meaning.
export const SELECTION_RING_COLOR = "#3b82f6";

// A neutral, deliberately quieter hue than the semantic status/gate/
// selection colors above -- reuse is informational, not a judgment call the
// way success/failure/running are, so it doesn't need to compete for
// attention the way those do.
export const REUSE_BADGE_COLOR = "var(--color-violet-800)";

export function getStatusBorderColor(
  status: StepStatus | undefined,
): string | undefined {
  switch (status) {
    case "running":
      return STATUS_RUNNING_COLOR;
    case "completed":
      return GATE_SUCCESS_COLOR;
    case "failed":
      return GATE_FAILURE_COLOR;
    default:
      return undefined;
  }
}
