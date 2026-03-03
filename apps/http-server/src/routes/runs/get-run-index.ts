import { FastifyInstance } from "fastify";
import { isRunId } from "../../utils/is-run-id.js";
import { GetRunIndexRes } from "@lcase/types";

export const getRunIndex = async (app: FastifyInstance) => {
  app.get<{ Params: { runId: unknown } }>(
    "/:runId",
    async (req, reply): Promise<GetRunIndexRes> => {
      const { runId } = req.params;
      if (!isRunId(runId)) return { ok: false, error: "Invalid run id" };

      const runIndex = await app.services.run.getRunIndex(runId);
      if (!runIndex.ok) return { ok: false, error: runIndex.error };

      return { ok: true, index: runIndex.value };
    },
  );
};
