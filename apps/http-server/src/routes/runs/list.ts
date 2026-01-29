import type { FastifyInstance } from "fastify";

export const listRunsRoute = async (app: FastifyInstance) => {
  app.get("/", async (req, reply) => {
    reply.send({ ok: true });
  });
};
