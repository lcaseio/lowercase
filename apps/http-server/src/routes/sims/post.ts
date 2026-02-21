import { FastifyInstance } from "fastify";
import { PostSimsReq, PostSimsRes } from "@lcase/types";
import { validateFlowHash } from "../runs/request.js";

export const postSimsRoute = async (app: FastifyInstance) => {
  app.post<{ Body: PostSimsReq }>(
    "/",
    async (req, rep): Promise<PostSimsRes> => {
      const { flowDefHash, parentRunId, reuse, name } = req.body;
      const validFowDefHash = validateFlowHash(flowDefHash);
      if (!validFowDefHash) return { ok: false, error: "Invalid flowDefHash" };
      if (!reuse) return { ok: false, error: "Must specific steps to reuse" };
      if (!parentRunId)
        return { ok: false, error: "Must specify a parent run id." };

      const result = await app.services.sim.saveForkSpec({
        flowDefHash,
        name,
        forkSpec: { parentRunId, reuse },
      });

      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, forkSpecHash: result.value };
    },
  );
};
