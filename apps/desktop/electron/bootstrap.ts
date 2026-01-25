import { createRuntime, RuntimeConfig } from "@lcase/runtime";
import { ForkSpecController, WorkflowController } from "@lcase/controller";

// bootstrap the workflow runtime and workflow controller
export function bootstrap(config: RuntimeConfig): {
  controller: WorkflowController;
} {
  const runtime = createRuntime(config);
  const fsc = new ForkSpecController(runtime.ctx.artifacts, runtime.ctx.ef);
  const controller = new WorkflowController(runtime, fsc);
  return { controller };
}
