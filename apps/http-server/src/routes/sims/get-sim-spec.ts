import { ForkSpec, GetSimSpecReq, GetSimSpecRes } from "@lcase/types";
import type { FastifyInstance } from "fastify";
import { isHash } from "../../utils/is-hash.js";

export const getSimSpec = async (app: FastifyInstance) => {
  app.get<{ Params: GetSimSpecReq }>(
    "/:hash",
    async (req, reply): Promise<GetSimSpecRes> => {
      const { hash } = req.params;
      if (!isHash(hash)) return { ok: false, error: "Invalid sim hash" };
      const simSpec = await app.services.sim.getForkSpec(hash);

      if (simSpec.ok) return { ok: true, spec: simSpec.value as ForkSpec };
      return simSpec; // contains error message
    },
  );
};
