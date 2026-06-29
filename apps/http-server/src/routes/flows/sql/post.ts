import type { PostSqlFlowReq } from "@lcase/types";
import type { FastifyInstance } from "fastify/types/instance.js";

export const postSqlFlowsRoute = async (app: FastifyInstance) => {
  app.post<{ Body: PostSqlFlowReq["body"] }>("/", async (req) => {
    return app.services.flow.addFlowSql(req.body);
  });
};
