import type { FastifyInstance } from "fastify";

export const listSqlFlowsRoute = async (app: FastifyInstance) => {
  app.get("/", async () => {
    return app.services.flow.getAllFlowRecordsSql();
  });
};

export const listSqlFlowVersionsRoute = async (app: FastifyInstance) => {
  app.get<{ Params: { flowId: string } }>("/:flowId/versions", async (req) => {
    return app.services.flow.getFlowVersionsSql(req.params.flowId);
  });
};

export const getSqlFlowVersionRoute = async (app: FastifyInstance) => {
  app.get<{ Params: { versionId: string } }>(
    "/versions/:versionId",
    async (req) => {
      return app.services.flow.getFlowVersionDefSql(req.params.versionId);
    },
  );
};
