import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { getArtifactRoute } from "../src/routes/artifacts/get-artifact.js";
import { listArtifactsRoute } from "../src/routes/artifacts/list-artifacts.js";
import { putJsonArtifactRoute } from "../src/routes/artifacts/put-json-artifact.js";

describe("artifact routes", () => {
  it("lists indexed artifacts newest first", async () => {
    const app = Fastify();
    app.decorate("services", {
      artifact: {
        listArtifacts: vi.fn().mockResolvedValue([
          { hash: "b".repeat(64), time: "2026-01-01T00:00:00.000Z" },
          { hash: "a".repeat(64), time: "2025-01-01T00:00:00.000Z" },
        ]),
      },
    });

    await app.register(listArtifactsRoute);

    const response = await app.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      value: [
        { hash: "b".repeat(64), time: "2026-01-01T00:00:00.000Z" },
        { hash: "a".repeat(64), time: "2025-01-01T00:00:00.000Z" },
      ],
    });
  });

  it("returns tagged artifact responses", async () => {
    const app = Fastify();
    app.decorate("services", {
      artifact: {
        getArtifact: vi.fn().mockResolvedValue({
          ok: true,
          format: "markdown",
          value: "# prompt",
        }),
      },
    });

    await app.register(getArtifactRoute);

    const response = await app.inject({
      method: "GET",
      url: `/${"a".repeat(64)}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      format: "markdown",
      value: "# prompt",
    });
  });

  it("passes optional label when creating json artifacts", async () => {
    const putArtifact = vi.fn().mockResolvedValue({ ok: true, value: "hash" });
    const app = Fastify();
    app.decorate("services", {
      artifact: {
        putArtifact,
      },
    });

    await app.register(putJsonArtifactRoute);

    const response = await app.inject({
      method: "POST",
      url: "/json",
      payload: {
        value: { hello: "world" },
        label: "Prompt",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(putArtifact).toHaveBeenCalledWith({
      format: "json",
      value: { hello: "world" },
      index: { label: "Prompt" },
    });
  });
});
