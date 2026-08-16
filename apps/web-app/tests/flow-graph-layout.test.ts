import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { computeDagreLayout } from "@/lib/flow-graph-layout";
import type {
  FlowAnalysis,
  FlowDefinition,
  StepDefinition,
} from "@lcase/types";

// None of the nodes in buildFixture() are httpjson, so sizing stays at the
// flat default -- these tests aren't about custom-node sizing, just layout.
// sizeForNode() only branches on "httpjson", so a plain non-httpjson filler
// type is enough here.
function buildFlowDef(
  overrides: Record<string, StepDefinition> = {},
): FlowDefinition {
  const steps: Record<string, StepDefinition> = {};
  for (const node of ["a", "b", "c", "d", "e", "f", "g", "orphan"]) {
    steps[node] = { type: "parallel", steps: [] };
  }
  return {
    name: "fixture",
    version: "1",
    start: "a",
    steps: { ...steps, ...overrides },
  };
}

// Mirrors the fixture shape in packages/flow-analysis/tests/graph-layout.test.ts
// (a -> {b, c} -> join at d -> e -> {f, g}), so the two algorithms' behavior
// on the same graph shape is easy to compare by reading both test files.
function buildFixture(): FlowAnalysis {
  return {
    inEdges: {
      b: [
        { type: "parallel", gate: "always", startStepId: "a", endStepId: "b" },
      ],
      c: [
        { type: "parallel", gate: "always", startStepId: "a", endStepId: "c" },
      ],
      d: [
        { type: "join", gate: "always", startStepId: "b", endStepId: "d" },
        { type: "join", gate: "always", startStepId: "c", endStepId: "d" },
      ],
      e: [
        {
          type: "control",
          gate: "onSuccess",
          startStepId: "d",
          endStepId: "e",
        },
      ],
      f: [
        {
          type: "control",
          gate: "onSuccess",
          startStepId: "e",
          endStepId: "f",
        },
      ],
      g: [
        {
          type: "control",
          gate: "onFailure",
          startStepId: "e",
          endStepId: "g",
        },
      ],
    },
    outEdges: {
      a: [
        { type: "parallel", gate: "always", startStepId: "a", endStepId: "b" },
        { type: "parallel", gate: "always", startStepId: "a", endStepId: "c" },
      ],
      b: [{ type: "join", gate: "always", startStepId: "b", endStepId: "d" }],
      c: [{ type: "join", gate: "always", startStepId: "c", endStepId: "d" }],
      d: [
        {
          type: "control",
          gate: "onSuccess",
          startStepId: "d",
          endStepId: "e",
        },
      ],
      e: [
        {
          type: "control",
          gate: "onSuccess",
          startStepId: "e",
          endStepId: "f",
        },
        {
          type: "control",
          gate: "onFailure",
          startStepId: "e",
          endStepId: "g",
        },
      ],
    },
    joinDeps: { d: ["b", "c"] },
    nodes: ["a", "b", "c", "d", "e", "f", "g"],
    problems: [],
    toposort: ["a", "b", "c", "d", "e", "f", "g"],
    refs: [],
  };
}

describe("computeDagreLayout()", () => {
  it("returns a position for every node in the flow", () => {
    const positions = computeDagreLayout(buildFixture(), "TB", buildFlowDef());
    expect(positions).not.toBeNull();
    expect(Object.keys(positions!).sort()).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
    ]);
  });

  it("lays out earlier steps above later ones in TB, left-to-right in LR", () => {
    const tb = computeDagreLayout(buildFixture(), "TB", buildFlowDef())!;
    expect(tb.a.y).toBeLessThan(tb.b.y);
    expect(tb.b.y).toBeLessThan(tb.d.y);

    const lr = computeDagreLayout(buildFixture(), "LR", buildFlowDef())!;
    expect(lr.a.x).toBeLessThan(lr.b.x);
    expect(lr.b.x).toBeLessThan(lr.d.x);
  });

  it("still includes a node with no edges at all (not just root-reachable ones)", () => {
    const fa = buildFixture();
    fa.nodes = [...fa.nodes, "orphan"];
    const positions = computeDagreLayout(fa, "TB", buildFlowDef())!;
    expect(positions.orphan).toBeDefined();
  });

  it("returns null when no toposort exists (cycle detected)", () => {
    const fa = buildFixture();
    fa.toposort = undefined;
    expect(computeDagreLayout(fa, "TB", buildFlowDef())).toBeNull();
  });

  it("gives every node bottom/top handles in TB, left/right handles in LR", () => {
    const tb = computeDagreLayout(buildFixture(), "TB", buildFlowDef())!;
    expect(tb.a.sourcePosition).toBe(Position.Bottom);
    expect(tb.a.targetPosition).toBe(Position.Top);

    const lr = computeDagreLayout(buildFixture(), "LR", buildFlowDef())!;
    expect(lr.a.sourcePosition).toBe(Position.Right);
    expect(lr.a.targetPosition).toBe(Position.Left);
  });

  it("sizes non-httpjson nodes at the flat default regardless of out-edge count", () => {
    // "a" has 2 out-edges (to b and c) but is a "parallel" step, not httpjson
    const tb = computeDagreLayout(buildFixture(), "TB", buildFlowDef())!;
    expect(tb.a.width).toBe(200);
    expect(tb.a.height).toBe(50);
  });

  it("grows an httpjson node's width (TB) with its real out-edge count, and its height by a flat clearance whenever it has at least one", () => {
    // "e" has 2 out-edges in the fixture (onSuccess -> f, onFailure -> g);
    // "d" has exactly 1 (onSuccess -> e); "g" has none.
    const flowDef = buildFlowDef({
      d: { type: "httpjson", url: "https://example.com" },
      e: { type: "httpjson", url: "https://example.com" },
      g: { type: "httpjson", url: "https://example.com" },
    });
    const tb = computeDagreLayout(buildFixture(), "TB", flowDef)!;

    expect(tb.e.width).toBe(145); // 100 + (2 - 1) * 45
    expect(tb.e.height).toBe(64); // 50 + 14 clearance (flat label room)
    expect(tb.d.width).toBe(100); // 1 out-edge -> no width growth
    expect(tb.d.height).toBe(64); // still >= 1 out-edge -> same clearance
    expect(tb.g.width).toBe(100); // 0 out-edges -> no growth
    expect(tb.g.height).toBe(50); // 0 out-edges -> no clearance needed
  });

  it("grows an httpjson node's height (LR) with its real out-edge count, width unchanged", () => {
    // "e" has 2 out-edges, "d" has 1, "g" has 0 -- LR height anchors from the
    // top offset (below header + step name) plus a fixed bottom margin, not
    // a flat base + growth, so a 0-edge node stays at the plain default.
    const flowDef = buildFlowDef({
      d: { type: "httpjson", url: "https://example.com" },
      e: { type: "httpjson", url: "https://example.com" },
      g: { type: "httpjson", url: "https://example.com" },
    });
    const lr = computeDagreLayout(buildFixture(), "LR", flowDef)!;
    expect(lr.e.height).toBe(81); // 46 + (2 - 1) * 15 + 20
    expect(lr.e.width).toBe(100);
    expect(lr.d.height).toBe(66); // 46 + (1 - 1) * 15 + 20
    expect(lr.g.height).toBe(50); // 0 out-edges -> plain default, no anchor
  });
});
