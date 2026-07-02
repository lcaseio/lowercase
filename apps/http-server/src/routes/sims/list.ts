import { GetSimsRes } from "@lcase/types";
import type { FastifyInstance } from "fastify";

export const simsListRoute = async (app: FastifyInstance) => {
  app.get("/", async (req, reply): Promise<GetSimsRes> => {
    const sims = await app.services.sim.getAllSims();
    return { ok: true, value: sims };
  });
};
