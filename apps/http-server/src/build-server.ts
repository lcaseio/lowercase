import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import { config } from "./runtime.config.js";
import { createServices } from "@lcase/runtime";
import { routes } from "./routes/routes.js";
import { wsRoute } from "./routes/ws-route.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify();
  // NOTE:  order matters when registering plugins

  const services = createServices(config);
  app.decorate("services", services);

  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  });

  await app.register(multipart, { limits: { fileSize: 1000 * 1024 * 1024 } });
  await app.register(websocket);

  await app.register(routes);
  await app.register(wsRoute);

  const system = await app.services.system.startSystem();
  await app.services.ws.start();
  console.log("System status: ", system);

  app.addHook("onClose", async (app) => {
    await app.services.system.stopSystem();
    console.log("Stopped system runtime.");
  });

  return app;
}
