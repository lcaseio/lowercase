import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { listFlowsRoute } from "./flows/get.js";
import { postFlowsRoute } from "./flows/add.js";
import { listRunsRoute } from "./runs/list.js";
import { postFlowsFilesRoute } from "./flows/files/post.js";
import { getFlowDefRoute } from "./flows/get-flow-def.js";
import { requestRunsRoute } from "./runs/request.js";

export const routes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // api/flows
  await app.register(listFlowsRoute, { prefix: "/api/flows" });
  await app.register(getFlowDefRoute, { prefix: "/api/flows" });
  await app.register(postFlowsRoute, { prefix: "/api/flows" });
  await app.register(postFlowsFilesRoute, { prefix: "/api/flows/files" });

  // api/runs
  await app.register(listRunsRoute, { prefix: "/api/runs" }); // get
  await app.register(requestRunsRoute, { prefix: "/api/runs" }); // post
};
