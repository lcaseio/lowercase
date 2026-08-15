import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { computeDagreLayout } from "@/lib/flow-graph-layout";
import type { FlowAnalysis } from "@lcase/types";

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
    const positions = computeDagreLayout(buildFixture(), "TB");
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
    const tb = computeDagreLayout(buildFixture(), "TB")!;
    expect(tb.a.y).toBeLessThan(tb.b.y);
    expect(tb.b.y).toBeLessThan(tb.d.y);

    const lr = computeDagreLayout(buildFixture(), "LR")!;
    expect(lr.a.x).toBeLessThan(lr.b.x);
    expect(lr.b.x).toBeLessThan(lr.d.x);
  });

  it("still includes a node with no edges at all (not just root-reachable ones)", () => {
    const fa = buildFixture();
    fa.nodes = [...fa.nodes, "orphan"];
    const positions = computeDagreLayout(fa, "TB")!;
    expect(positions.orphan).toBeDefined();
  });

  it("returns null when no toposort exists (cycle detected)", () => {
    const fa = buildFixture();
    fa.toposort = undefined;
    expect(computeDagreLayout(fa, "TB")).toBeNull();
  });

  it("gives every node bottom/top handles in TB, left/right handles in LR", () => {
    const tb = computeDagreLayout(buildFixture(), "TB")!;
    expect(tb.a.sourcePosition).toBe(Position.Bottom);
    expect(tb.a.targetPosition).toBe(Position.Top);

    const lr = computeDagreLayout(buildFixture(), "LR")!;
    expect(lr.a.sourcePosition).toBe(Position.Right);
    expect(lr.a.targetPosition).toBe(Position.Left);
  });
});
