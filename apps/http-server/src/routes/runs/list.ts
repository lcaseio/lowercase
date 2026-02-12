import type { FastifyInstance } from "fastify";

export const listRunsRoute = async (app: FastifyInstance) => {
  app.get("/", async (req, reply) => {
    const runList = await app.services.run.listAllRuns();
    return { runList };
  });
};
