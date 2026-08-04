import { describe, expect, it, vi } from "vitest";
import {
  loadPersistedExplorerState,
  savePersistedExplorerState,
} from "@/redux/explorer-persistence";
import type { FlowGraphPanelsState } from "@/redux/slices/flow-graph-panels-slice";
import type { EventGraphPanelsState } from "@/redux/slices/event-graph-panels-slice";
import type { SerializedDockview } from "dockview-react";

const STORAGE_KEY = "explorer-workspace:default";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: vi.fn((key: string) => data[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data[key] = value;
    }),
  };
}

function throwingStorage() {
  return {
    getItem: vi.fn(() => {
      throw new Error("blocked");
    }),
    setItem: vi.fn(() => {
      throw new Error("quota exceeded");
    }),
  };
}

const EMPTY_STORAGE = fakeStorage();

const SAMPLE_DOCKVIEW = { grid: {} } as unknown as SerializedDockview;
const SAMPLE_PANELS: FlowGraphPanelsState = {
  "flow-graph-v1": {
    selectedParamHashes: { a: "h1" },
    rightPanelTab: "runinput",
    runId: "run-1",
    selectedStepId: null,
  },
};
const SAMPLE_EVENT_GRAPH_PANELS: EventGraphPanelsState = {
  "event-graph-singleton": {
    trackedPanelId: "flow-graph-v1",
    snapshot: { runId: "run-1", versionId: "version-1" },
    selectedEventId: "event-1",
    sidePanelTab: "eventdetails",
  },
};
const OTHER_DOCKVIEW = {
  grid: { other: true },
} as unknown as SerializedDockview;
const OTHER_PANELS: FlowGraphPanelsState = {
  "flow-graph-v2": {
    selectedParamHashes: {},
    rightPanelTab: null,
    runId: "run-2",
    selectedStepId: null,
  },
};
const OTHER_EVENT_GRAPH_PANELS: EventGraphPanelsState = {
  "event-graph-singleton": {
    trackedPanelId: "flow-graph-v2",
    snapshot: { runId: "run-2", versionId: "version-2" },
    selectedEventId: null,
    sidePanelTab: null,
  },
};

function storageWithEnvelope(envelope: unknown) {
  return fakeStorage({ [STORAGE_KEY]: JSON.stringify(envelope) });
}

describe("loadPersistedExplorerState", () => {
  it("returns all-null when both storages are empty", () => {
    expect(
      loadPersistedExplorerState({
        session: fakeStorage(),
        local: fakeStorage(),
      }),
    ).toEqual({
      dockview: null,
      flowGraphPanels: null,
      eventGraphPanels: null,
    });
  });

  it("returns all-null when getItem throws on both", () => {
    expect(
      loadPersistedExplorerState({
        session: throwingStorage(),
        local: throwingStorage(),
      }),
    ).toEqual({
      dockview: null,
      flowGraphPanels: null,
      eventGraphPanels: null,
    });
  });

  it("returns all-null when the stored value isn't valid JSON", () => {
    const bad = fakeStorage({ [STORAGE_KEY]: "not json" });
    expect(
      loadPersistedExplorerState({ session: bad, local: fakeStorage() }),
    ).toEqual({
      dockview: null,
      flowGraphPanels: null,
      eventGraphPanels: null,
    });
  });

  it("returns all-null when version doesn't match", () => {
    const wrongVersion = storageWithEnvelope({
      version: 0,
      dockview: SAMPLE_DOCKVIEW,
      panelState: {
        flowGraphPanels: SAMPLE_PANELS,
        eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
      },
    });
    expect(
      loadPersistedExplorerState({
        session: wrongVersion,
        local: fakeStorage(),
      }),
    ).toEqual({
      dockview: null,
      flowGraphPanels: null,
      eventGraphPanels: null,
    });
  });

  it("returns all three pieces when version matches and all validate", () => {
    const good = storageWithEnvelope({
      version: 1,
      dockview: SAMPLE_DOCKVIEW,
      panelState: {
        flowGraphPanels: SAMPLE_PANELS,
        eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
      },
    });
    expect(
      loadPersistedExplorerState({ session: good, local: fakeStorage() }),
    ).toEqual({
      dockview: SAMPLE_DOCKVIEW,
      flowGraphPanels: SAMPLE_PANELS,
      eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
    });
  });

  it("keeps dockview when panelState.flowGraphPanels is malformed", () => {
    const partial = storageWithEnvelope({
      version: 1,
      dockview: SAMPLE_DOCKVIEW,
      panelState: {
        flowGraphPanels: "not an object",
        eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
      },
    });
    expect(
      loadPersistedExplorerState({ session: partial, local: fakeStorage() }),
    ).toEqual({
      dockview: SAMPLE_DOCKVIEW,
      flowGraphPanels: null,
      eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
    });
  });

  it("keeps dockview and flowGraphPanels when panelState.eventGraphPanels is malformed", () => {
    const partial = storageWithEnvelope({
      version: 1,
      dockview: SAMPLE_DOCKVIEW,
      panelState: {
        flowGraphPanels: SAMPLE_PANELS,
        eventGraphPanels: "not an object",
      },
    });
    expect(
      loadPersistedExplorerState({ session: partial, local: fakeStorage() }),
    ).toEqual({
      dockview: SAMPLE_DOCKVIEW,
      flowGraphPanels: SAMPLE_PANELS,
      eventGraphPanels: null,
    });
  });

  it("also nulls flowGraphPanels and eventGraphPanels when dockview is missing -- a fresh panel manually reopened into an empty host shouldn't resurrect old business state", () => {
    const partial = storageWithEnvelope({
      version: 1,
      panelState: {
        flowGraphPanels: SAMPLE_PANELS,
        eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
      },
    });
    expect(
      loadPersistedExplorerState({ session: partial, local: fakeStorage() }),
    ).toEqual({
      dockview: null,
      flowGraphPanels: null,
      eventGraphPanels: null,
    });
  });

  describe("session-first, local-fallback behavior", () => {
    it("uses session's snapshot and ignores local entirely when session has a valid one", () => {
      const session = storageWithEnvelope({
        version: 1,
        dockview: SAMPLE_DOCKVIEW,
        panelState: {
          flowGraphPanels: SAMPLE_PANELS,
          eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
        },
      });
      const local = storageWithEnvelope({
        version: 1,
        dockview: OTHER_DOCKVIEW,
        panelState: {
          flowGraphPanels: OTHER_PANELS,
          eventGraphPanels: OTHER_EVENT_GRAPH_PANELS,
        },
      });
      expect(loadPersistedExplorerState({ session, local })).toEqual({
        dockview: SAMPLE_DOCKVIEW,
        flowGraphPanels: SAMPLE_PANELS,
        eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
      });
    });

    it("falls back to local when session is empty (a genuinely new tab)", () => {
      const local = storageWithEnvelope({
        version: 1,
        dockview: OTHER_DOCKVIEW,
        panelState: {
          flowGraphPanels: OTHER_PANELS,
          eventGraphPanels: OTHER_EVENT_GRAPH_PANELS,
        },
      });
      expect(
        loadPersistedExplorerState({ session: EMPTY_STORAGE, local }),
      ).toEqual({
        dockview: OTHER_DOCKVIEW,
        flowGraphPanels: OTHER_PANELS,
        eventGraphPanels: OTHER_EVENT_GRAPH_PANELS,
      });
    });

    it("falls back to local when session's envelope is corrupt or wrong version", () => {
      const badSession = storageWithEnvelope({
        version: 0,
        dockview: SAMPLE_DOCKVIEW,
        panelState: {
          flowGraphPanels: SAMPLE_PANELS,
          eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
        },
      });
      const local = storageWithEnvelope({
        version: 1,
        dockview: OTHER_DOCKVIEW,
        panelState: {
          flowGraphPanels: OTHER_PANELS,
          eventGraphPanels: OTHER_EVENT_GRAPH_PANELS,
        },
      });
      expect(
        loadPersistedExplorerState({ session: badSession, local }),
      ).toEqual({
        dockview: OTHER_DOCKVIEW,
        flowGraphPanels: OTHER_PANELS,
        eventGraphPanels: OTHER_EVENT_GRAPH_PANELS,
      });
    });

    it("does not patch a valid session envelope's null fields from local -- the choice is whole-envelope, never per field", () => {
      const session = storageWithEnvelope({
        version: 1,
        panelState: {
          flowGraphPanels: SAMPLE_PANELS,
          eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
        }, // dockview missing
      });
      const local = storageWithEnvelope({
        version: 1,
        dockview: OTHER_DOCKVIEW,
        panelState: {
          flowGraphPanels: OTHER_PANELS,
          eventGraphPanels: OTHER_EVENT_GRAPH_PANELS,
        },
      });
      expect(loadPersistedExplorerState({ session, local })).toEqual({
        dockview: null, // stays null, not patched from local's dockview
        // also null (dockview-depends-on rule), not patched from local's
        // flowGraphPanels/eventGraphPanels either
        flowGraphPanels: null,
        eventGraphPanels: null,
      });
    });
  });
});

describe("savePersistedExplorerState", () => {
  it("writes the same version/dockview/panelState payload to both session and local", () => {
    const session = fakeStorage();
    const local = fakeStorage();
    savePersistedExplorerState(
      {
        dockview: SAMPLE_DOCKVIEW,
        flowGraphPanels: SAMPLE_PANELS,
        eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
      },
      { session, local },
    );

    for (const storage of [session, local]) {
      expect(storage.setItem).toHaveBeenCalledOnce();
      const [key, value] = storage.setItem.mock.calls[0];
      expect(key).toBe(STORAGE_KEY);
      expect(JSON.parse(value)).toEqual({
        version: 1,
        dockview: SAMPLE_DOCKVIEW,
        panelState: {
          flowGraphPanels: SAMPLE_PANELS,
          eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
        },
      });
    }
  });

  it("doesn't throw if one storage's setItem throws, and still writes the other", () => {
    const brokenSession = throwingStorage();
    const local = fakeStorage();
    expect(() =>
      savePersistedExplorerState(
        {
          dockview: SAMPLE_DOCKVIEW,
          flowGraphPanels: SAMPLE_PANELS,
          eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
        },
        { session: brokenSession, local },
      ),
    ).not.toThrow();
    expect(local.setItem).toHaveBeenCalledOnce();
  });

  it("doesn't throw if both storages' setItem throw", () => {
    expect(() =>
      savePersistedExplorerState(
        {
          dockview: SAMPLE_DOCKVIEW,
          flowGraphPanels: SAMPLE_PANELS,
          eventGraphPanels: SAMPLE_EVENT_GRAPH_PANELS,
        },
        { session: throwingStorage(), local: throwingStorage() },
      ),
    ).not.toThrow();
  });
});
