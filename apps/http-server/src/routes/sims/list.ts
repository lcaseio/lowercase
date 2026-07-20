import { GetSimsReq, GetSimsRes } from "@lcase/types";
import type { FastifyInstance } from "fastify";

export const simsListRoute = async (app: FastifyInstance) => {
  app.get<{ Querystring: GetSimsReq }>(
    "/",
    async (req, reply): Promise<GetSimsRes> => {
      const { flowVersionId } = req.query;
      const sims = flowVersionId
        ? await app.services.sim.getSimsByFlowVersionId(flowVersionId)
        : await app.services.sim.getAllSims();
      return { ok: true, value: sims };
    },
  );
};
