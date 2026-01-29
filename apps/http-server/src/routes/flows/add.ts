import type { FastifyInstance } from "fastify/types/instance.js";

export const addFlowsRoute = async (app: FastifyInstance) => {
  app.post("/add", async (req, reply) => {
    reply.send({ ok: true });
  });
};
