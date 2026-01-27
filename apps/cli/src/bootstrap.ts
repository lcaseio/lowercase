import { ForkSpecController, WorkflowController } from "@lcase/controller";
import { createRuntime, createServices } from "@lcase/runtime";
import { config } from "./runtime.config.js";

export function bootstrap() {
  const services = createServices(config);
  return services;
}
