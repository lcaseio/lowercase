import { ForkSpecController, WorkflowController } from "@lcase/controller";
import { createRuntime } from "@lcase/runtime";
import { config } from "./runtime.config.js";

export function bootstrap() {
  const runtime = createRuntime(config);
  const fsc = new ForkSpecController(
    runtime.ctx.artifacts,
    runtime.ctx.ef,
    runtime.ctx.runIndexStore,
  );
  const controller = new WorkflowController(runtime, fsc);
  return controller;
}
