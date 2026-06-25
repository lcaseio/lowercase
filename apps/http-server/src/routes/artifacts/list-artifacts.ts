import type { FastifyInstance } from "fastify/types/instance.js";
import type { GetArtifactsRes } from "@lcase/types";

export const listArtifactsRoute = async (app: FastifyInstance) => {
  app.get("/", async (_req, reply): Promise<GetArtifactsRes> => {
    try {
      const artifacts = await app.services.artifact.listArtifacts();
      return { ok: true, value: artifacts };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Error listing artifacts",
      };
    }
  });
};
