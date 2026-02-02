import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { listFlowsRoute } from "./flows/list.js";
import { postFlowsRoute } from "./flows/add.js";
import { listRunsRoute } from "./runs/list.js";
import { postFlowsFilesRoute } from "./flows/files/post.js";

export const routes: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(listFlowsRoute, { prefix: "/api/flows" });
  await app.register(postFlowsRoute, { prefix: "/api/flows" });
  await app.register(postFlowsFilesRoute, { prefix: "/api/flows/files" });
  await app.register(listRunsRoute, { prefix: "/api/runs" });
};
