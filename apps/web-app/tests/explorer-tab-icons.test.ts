import { describe, expect, it } from "vitest";
import {
  getExplorerTabIcon,
  FLOW_GRAPH_ICON,
  FLOW_GRAPH_ICON_CLASS,
  JSON_DEFINITION_ICON,
  JSON_DEFINITION_ICON_CLASS,
  RUN_ICON,
  RUN_ICON_CLASS,
  SIM_ICON,
  SIM_ICON_CLASS,
  EVENT_GRAPH_ICON,
  EVENT_GRAPH_ICON_CLASS,
} from "@/components/explorer/explorer-tab-icons";

describe("getExplorerTabIcon", () => {
  it("returns the settings icon, uncolored, for flow-settings", () => {
    const icon = getExplorerTabIcon({
      kind: "flow-settings",
      label: "x",
      flowId: "f1",
    });
    expect(icon?.className).toBeUndefined();
  });

  it("returns the json-definition icon+color for json-definition", () => {
    const icon = getExplorerTabIcon({
      kind: "json-definition",
      label: "x",
      versionId: "v1",
    });
    expect(icon?.Icon).toBe(JSON_DEFINITION_ICON);
    expect(icon?.className).toBe(JSON_DEFINITION_ICON_CLASS);
  });

  it("returns the flow-graph icon+color for a plain flow-graph panel", () => {
    const icon = getExplorerTabIcon({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "plain" },
    });
    expect(icon?.Icon).toBe(FLOW_GRAPH_ICON);
    expect(icon?.className).toBe(FLOW_GRAPH_ICON_CLASS);
  });

  it("returns the run icon+color for a run-opened flow-graph panel", () => {
    const icon = getExplorerTabIcon({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "run", runId: "r1" },
    });
    expect(icon?.Icon).toBe(RUN_ICON);
    expect(icon?.className).toBe(RUN_ICON_CLASS);
  });

  it("returns the sim icon+color for a sim-opened flow-graph panel", () => {
    const icon = getExplorerTabIcon({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "sim", simId: "s1" },
    });
    expect(icon?.Icon).toBe(SIM_ICON);
    expect(icon?.className).toBe(SIM_ICON_CLASS);
  });

  it("returns the event-graph icon+color, mirroring its toolbar button", () => {
    const icon = getExplorerTabIcon({ kind: "event-graph", label: "x" });
    expect(icon?.Icon).toBe(EVENT_GRAPH_ICON);
    expect(icon?.className).toBe(EVENT_GRAPH_ICON_CLASS);
  });
});
