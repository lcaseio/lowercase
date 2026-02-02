import type { FastifyInstance } from "fastify";

export const listFlowsRoute = async (app: FastifyInstance) => {
  app.get("/", async (req, reply) => {
    const result = await app.services.flow.getAllFlowIndexes();

    if (result.ok) return { ok: result.ok, indexes: result.value };
    return reply.send(result);
  });
};
