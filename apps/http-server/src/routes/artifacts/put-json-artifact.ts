import type { FastifyInstance } from "fastify/types/instance.js";
import type { JsonValue } from "@lcase/types";

export const putJsonArtifactRoute = async (app: FastifyInstance) => {
  app.post<{ Body: JsonValue }>("/json", async (req, reply) => {
    const artifact = req.body;
    const result = await app.services.artifact.putArtifact({
      format: "json",
      value: artifact,
    });
    return result;
  });
};
