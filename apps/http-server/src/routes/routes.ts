import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { listFlowsRoute } from "./flows/list.js";
import { addFlowsRoute } from "./flows/add.js";
import { listRunsRoute } from "./runs/list.js";

export const routes: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(listFlowsRoute, { prefix: "/flows" });
  await app.register(addFlowsRoute, { prefix: "/flows" });
  await app.register(listRunsRoute, { prefix: "/runs" });
};
