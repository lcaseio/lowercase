import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestRunsRoute } from "../src/routes/runs/request.js";

describe("run request route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires flowId and flowVersionId on POST /api/runs", async () => {
    const app = Fastify();
    app.decorate("services", {
      run: {
        requestRun: vi.fn(),
        makeRunId: vi.fn().mockReturnValue("run-1"),
      },
      ws: {
        monitorRun: vi.fn(),
      },
    });

    await app.register(requestRunsRoute, { prefix: "/api/runs" });

    const response = await app.inject({
      method: "POST",
      url: "/api/runs",
      payload: {
        flowDefHash: "a".repeat(64),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: false,
      error: "Invalid flowId",
    });

    await app.close();
  });

  it("passes relational flow metadata and simId through to the run service", async () => {
    const requestRun = vi.fn();
    const app = Fastify();
    app.decorate("services", {
      run: {
        requestRun,
        makeRunId: vi.fn().mockReturnValue("run-123"),
      },
      ws: {
        monitorRun: vi.fn(),
      },
    });

    await app.register(requestRunsRoute, { prefix: "/api/runs" });

    const response = await app.inject({
      method: "POST",
      url: "/api/runs",
      payload: {
        flowId: "flow-1",
        flowVersionId: "flow-version-1",
        flowDefHash: "a".repeat(64),
        simId: "sim-1",
        forkSpecHash: "b".repeat(64),
        params: {
          payload: "artifact-hash",
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      runId: "run-123",
    });
    expect(requestRun).toHaveBeenCalledWith({
      flowId: "flow-1",
      flowVersionId: "flow-version-1",
      flowDefHash: "a".repeat(64),
      source: "lowercase://http-server",
      runId: "run-123",
      simId: "sim-1",
      forkSpecHash: "b".repeat(64),
      params: {
        payload: "artifact-hash",
      },
    });

    await app.close();
  });
});
