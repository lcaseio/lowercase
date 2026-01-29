import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

import { config } from "./runtime.config.js";
import { createServices } from "@lcase/runtime";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify();
  // NOTE:  order matters when registering plugins

  const services = createServices(config);
  app.decorate("services", services);

  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  });

  // await app.register(routes);

  app.addHook("onClose", async (app) => {
    await app.services.system.stopSystem();
  });

  return app;
}
