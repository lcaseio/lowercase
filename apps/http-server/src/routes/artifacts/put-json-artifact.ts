import type { FastifyInstance } from "fastify/types/instance.js";
import type { PostJsonArtifactReq, PostJsonArtifactRes } from "@lcase/types";

export const putJsonArtifactRoute = async (app: FastifyInstance) => {
  app.post<{ Body: PostJsonArtifactReq }>(
    "/json",
    async (req, reply): Promise<PostJsonArtifactRes> => {
      const { value, label } = req.body;
      const result = await app.services.artifact.putArtifact({
        format: "json",
        value,
        ...(label ? { index: { label } } : {}),
      });
      return result;
    },
  );
};
