import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./runtime.config.js";
import { createLocalSystem } from "@lcase/runtime";
import { routes } from "./routes/routes.js";
import { eventsRoute } from "./routes/events-route.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify();
  // NOTE:  order matters when registering plugins

  const { services, runtime, tap } = createLocalSystem(config);
  app.decorate("services", services);
  app.decorate("tap", tap);

  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(multipart, { limits: { fileSize: 1000 * 1024 * 1024 } });

  await app.register(routes);
  await app.register(eventsRoute);

  const startOutcome = await runtime.start();
  console.log("System start outcome: ", startOutcome);

  app.addHook("onClose", async () => {
    await runtime.stop();
    console.log("Stopped system runtime.");
  });

  return app;
}
