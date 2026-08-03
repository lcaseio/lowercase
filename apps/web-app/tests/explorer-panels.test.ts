import { describe, expect, it, vi } from "vitest";
import {
  EXPLORER_PANEL_COMPONENT,
  explorerPanelId,
  openOrFocusPanel,
  type OpenPanelRequest,
} from "@/components/explorer/explorer-panels";

function fakePanel(params: OpenPanelRequest, title: string) {
  return {
    params,
    title,
    api: {
      setActive: vi.fn(),
      updateParameters: vi.fn(),
      setTitle: vi.fn(),
    },
  };
}

function fakeApi(existing?: ReturnType<typeof fakePanel>) {
  return {
    getPanel: vi.fn().mockReturnValue(existing),
    addPanel: vi.fn(),
  };
}

describe("explorerPanelId", () => {
  it("derives a stable id from kind + content id, per kind", () => {
    expect(
      explorerPanelId({ kind: "flow-settings", label: "x", flowId: "f1" }),
    ).toBe("flow-settings-f1");
    expect(
      explorerPanelId({ kind: "json-definition", label: "x", versionId: "v1" }),
    ).toBe("json-definition-v1");
    expect(
      explorerPanelId({ kind: "flow-graph", label: "x", versionId: "v1" }),
    ).toBe("flow-graph-v1");
  });

  it("gives two different versions of the same kind distinct ids", () => {
    const a = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
    });
    const b = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v2",
    });
    expect(a).not.toBe(b);
  });

  it("gives a run-specific flow-graph request a distinct id from the plain version request", () => {
    const plain = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
    });
    const runSpecific = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      runId: "r1",
    });
    expect(runSpecific).not.toBe(plain);
  });

  it("gives two different runs of the same version distinct ids", () => {
    const a = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      runId: "r1",
    });
    const b = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      runId: "r2",
    });
    expect(a).not.toBe(b);
  });

  it("gives a sim-specific flow-graph request a distinct id from the plain and run-specific requests", () => {
    const plain = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
    });
    const runSpecific = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      runId: "r1",
    });
    const simSpecific = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      simId: "s1",
    });
    expect(simSpecific).not.toBe(plain);
    expect(simSpecific).not.toBe(runSpecific);
  });

  it("gives two different sims of the same version distinct ids", () => {
    const a = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      simId: "s1",
    });
    const b = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      simId: "s2",
    });
    expect(a).not.toBe(b);
  });
});

describe("openOrFocusPanel", () => {
  it("adds a new panel with the derived id/component/title/params when none exists", () => {
    const api = fakeApi(undefined);
    const req: OpenPanelRequest = {
      kind: "flow-graph",
      label: "Version 1 Graph",
      versionId: "v1",
    };

    openOrFocusPanel(api as never, req);

    expect(api.addPanel).toHaveBeenCalledWith({
      id: "flow-graph-v1",
      component: EXPLORER_PANEL_COMPONENT,
      title: "Version 1 Graph",
      params: req,
    });
  });

  it("focuses an existing panel instead of adding a duplicate", () => {
    const req: OpenPanelRequest = {
      kind: "flow-graph",
      label: "Version 1 Graph",
      versionId: "v1",
    };
    const existing = fakePanel(req, "Version 1 Graph");
    const api = fakeApi(existing);

    openOrFocusPanel(api as never, req);

    expect(api.addPanel).not.toHaveBeenCalled();
    expect(existing.api.setActive).toHaveBeenCalledOnce();
  });

  it("does not re-write params/title on an unchanged refocus", () => {
    const req: OpenPanelRequest = {
      kind: "flow-graph",
      label: "Version 1 Graph",
      versionId: "v1",
    };
    const existing = fakePanel(req, "Version 1 Graph");
    const api = fakeApi(existing);

    openOrFocusPanel(api as never, req);

    expect(existing.api.updateParameters).not.toHaveBeenCalled();
    expect(existing.api.setTitle).not.toHaveBeenCalled();
    expect(existing.api.setActive).toHaveBeenCalledOnce();
  });

  it("refreshes params/title when content changed since it was opened", () => {
    const oldReq: OpenPanelRequest = {
      kind: "flow-settings",
      label: "Flow A",
      flowId: "f1",
    };
    const existing = fakePanel(oldReq, "Flow A");
    const api = fakeApi(existing);

    const newReq: OpenPanelRequest = {
      kind: "flow-settings",
      label: "Flow A (renamed)",
      flowId: "f1",
    };
    openOrFocusPanel(api as never, newReq);

    expect(existing.api.updateParameters).toHaveBeenCalledWith(newReq);
    expect(existing.api.setTitle).toHaveBeenCalledWith("Flow A (renamed)");
    expect(existing.api.setActive).toHaveBeenCalledOnce();
  });
});
