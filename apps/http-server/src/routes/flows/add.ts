import type { FlowDefinition } from "@lcase/types";
import type { FastifyInstance } from "fastify/types/instance.js";

export const postFlowsRoute = async (app: FastifyInstance) => {
  app.post<{ Body: FlowDefinition }>("/", async (req, reply) => {
    const flowDef = req.body;
    const result = await app.services.flow.addFlow(flowDef);
    if (!result.ok) return { ...result };
    return { ...result };
  });
};
