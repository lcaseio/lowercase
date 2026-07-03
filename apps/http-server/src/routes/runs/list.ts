import type { FastifyInstance } from "fastify";
import { GetRunsRes } from "@lcase/types";

export const listRunsRoute = async (app: FastifyInstance) => {
  app.get("/", async (req, reply): Promise<GetRunsRes> => {
    const runList = await app.services.run.listAllRuns();
    return { ok: true, runList };
  });
};
