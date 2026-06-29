import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { postSqlFlowsRoute } from "../src/routes/flows/sql/post.js";

describe("sql flow routes", () => {
  it("uses the parallel sql flow service path", async () => {
    const addFlowSql = vi.fn().mockResolvedValue({
      ok: true,
      value: {
        flow: {
          id: "flow_1",
          name: "Prompt Flow",
          description: "Reusable flow",
          createdAt: "2026-06-27T00:00:00.000Z",
          updatedAt: "2026-06-27T00:00:00.000Z",
        },
        version: {
          id: "version_1",
          flowId: "flow_1",
          sequence: 1,
          definitionHash: "a".repeat(64),
          versionLabel: "v1",
          description: "Reusable flow",
          createdAt: "2026-06-27T00:00:00.000Z",
        },
      },
    });

    const app = Fastify();
    app.decorate("services", {
      flow: {
        addFlowSql,
      },
    });

    await app.register(postSqlFlowsRoute);

    const response = await app.inject({
      method: "POST",
      url: "/",
      payload: {
        name: "Prompt Flow",
        version: "v1",
        steps: [],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(addFlowSql).toHaveBeenCalledWith({
      name: "Prompt Flow",
      version: "v1",
      steps: [],
    });
  });
});
