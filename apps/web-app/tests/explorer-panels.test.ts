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
      explorerPanelId({
        kind: "flow-graph",
        label: "x",
        versionId: "v1",
        openedAs: { type: "plain" },
      }),
    ).toBe("flow-graph-v1");
  });

  it("gives two different versions of the same kind distinct ids", () => {
    const a = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "plain" },
    });
    const b = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v2",
      openedAs: { type: "plain" },
    });
    expect(a).not.toBe(b);
  });

  it("gives a run-specific flow-graph request a distinct id from the plain version request", () => {
    const plain = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "plain" },
    });
    const runSpecific = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "run", runId: "r1" },
    });
    expect(runSpecific).not.toBe(plain);
  });

  it("gives two different runs of the same version distinct ids", () => {
    const a = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "run", runId: "r1" },
    });
    const b = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "run", runId: "r2" },
    });
    expect(a).not.toBe(b);
  });

  it("gives a sim-specific flow-graph request a distinct id from the plain and run-specific requests", () => {
    const plain = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "plain" },
    });
    const runSpecific = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "run", runId: "r1" },
    });
    const simSpecific = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "sim", simId: "s1" },
    });
    expect(simSpecific).not.toBe(plain);
    expect(simSpecific).not.toBe(runSpecific);
  });

  it("gives two different sims of the same version distinct ids", () => {
    const a = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "sim", simId: "s1" },
    });
    const b = explorerPanelId({
      kind: "flow-graph",
      label: "x",
      versionId: "v1",
      openedAs: { type: "sim", simId: "s2" },
    });
    expect(a).not.toBe(b);
  });

  it("gives every event-graph request the same id regardless of label -- it's a singleton", () => {
    const a = explorerPanelId({ kind: "event-graph", label: "Event Graph" });
    const b = explorerPanelId({ kind: "event-graph", label: "Something else" });
    expect(a).toBe(b);
    expect(a).toBe("event-graph-singleton");
  });

  it("derives an artifact request's id from its hash", () => {
    expect(
      explorerPanelId({
        kind: "artifact",
        label: "x",
        hash: "h1",
        versionId: "v1",
      }),
    ).toBe("artifact-h1");
  });

  it("gives every artifact-authoring request for the same version the same id -- one draft per version", () => {
    const a = explorerPanelId({
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId: "v1",
    });
    const b = explorerPanelId({
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId: "v1",
    });
    expect(a).toBe(b);
    expect(a).toBe("artifact-authoring-v1");
  });

  it("gives different versions' artifact-authoring requests different ids", () => {
    const a = explorerPanelId({
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId: "v1",
    });
    const b = explorerPanelId({
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId: "v2",
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
      openedAs: { type: "plain" },
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
      openedAs: { type: "plain" },
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
      openedAs: { type: "plain" },
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

  it("passes position through to addPanel when creating a brand-new panel", () => {
    const api = fakeApi(undefined);
    const req: OpenPanelRequest = { kind: "event-graph", label: "Event Graph" };

    openOrFocusPanel(api as never, req, {
      position: { direction: "right", referencePanel: "flow-graph-v1" },
    });

    expect(api.addPanel).toHaveBeenCalledWith({
      id: "event-graph-singleton",
      component: EXPLORER_PANEL_COMPONENT,
      title: "Event Graph",
      params: req,
      position: { direction: "right", referencePanel: "flow-graph-v1" },
      floating: false,
    });
  });

  it("passes initialTrackedPanelId through as part of params, as a one-shot bootstrap hint", () => {
    const api = fakeApi(undefined);
    const req: OpenPanelRequest = {
      kind: "event-graph",
      label: "Event Graph",
      initialTrackedPanelId: "flow-graph-v1",
    };

    openOrFocusPanel(api as never, req);

    expect(api.addPanel).toHaveBeenCalledWith({
      id: "event-graph-singleton",
      component: EXPLORER_PANEL_COMPONENT,
      title: "Event Graph",
      params: req,
    });
  });

  it("ignores position when refocusing an already-open panel", () => {
    const req: OpenPanelRequest = { kind: "event-graph", label: "Event Graph" };
    const existing = fakePanel(req, "Event Graph");
    const api = fakeApi(existing);

    openOrFocusPanel(api as never, req, {
      position: { direction: "right", referencePanel: "flow-graph-v1" },
    });

    expect(api.addPanel).not.toHaveBeenCalled();
    expect(existing.api.setActive).toHaveBeenCalledOnce();
  });

  it("adds a new artifact panel with the derived id/component/title/params", () => {
    const api = fakeApi(undefined);
    const req: OpenPanelRequest = {
      kind: "artifact",
      label: "notes.md",
      hash: "h1",
      versionId: "v1",
    };

    openOrFocusPanel(api as never, req);

    expect(api.addPanel).toHaveBeenCalledWith({
      id: "artifact-h1",
      component: EXPLORER_PANEL_COMPONENT,
      title: "notes.md",
      params: req,
    });
  });

  it("adds a new artifact-authoring panel with the derived id/component/title/params", () => {
    const api = fakeApi(undefined);
    const req: OpenPanelRequest = {
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId: "v1",
    };

    openOrFocusPanel(api as never, req);

    expect(api.addPanel).toHaveBeenCalledWith({
      id: "artifact-authoring-v1",
      component: EXPLORER_PANEL_COMPONENT,
      title: "New Artifact",
      params: req,
    });
  });

  it("refocuses an existing artifact-authoring panel for the same version instead of opening a second draft", () => {
    const req: OpenPanelRequest = {
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId: "v1",
    };
    const existing = fakePanel(req, "New Artifact");
    const api = fakeApi(existing);

    openOrFocusPanel(api as never, req);

    expect(api.addPanel).not.toHaveBeenCalled();
    expect(existing.api.setActive).toHaveBeenCalledOnce();
  });
});
