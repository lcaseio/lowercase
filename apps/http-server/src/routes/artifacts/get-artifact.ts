import type { FastifyInstance } from "fastify/types/instance.js";
import { isHash } from "../../utils/is-hash.js";
import type { GetArtifactReq, GetArtifactRes, JsonValue } from "@lcase/types";

export const getArtifactRoute = async (app: FastifyInstance) => {
  app.get<{ Params: GetArtifactReq }>(
    "/:hash",
    async (req, reply): Promise<GetArtifactRes> => {
      const { hash } = req.params;
      if (!isHash(hash)) return { ok: false, error: "Invalid hash" };
      const artifact = await app.services.artifact.getArtifact(hash);
      if (!artifact.ok) return artifact;
      return { ok: true, jsonValue: artifact.value };
    },
  );
};
