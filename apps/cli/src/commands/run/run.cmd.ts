import { Command } from "commander";
import { resolveCliPath } from "../../resolve-path.js";
import { WorkflowController } from "@lcase/controller";
import { ServicesPort } from "@lcase/ports";

export async function cliRunAction(
  services: ServicesPort,
  flowPath: string,
): Promise<void> {
  console.log("[cli] running run command");
  await services.system.startSystem();
  const resolvedFlowPath = resolveCliPath(flowPath);
  await services.flow.startFlow({ absoluteFilePath: resolvedFlowPath });
}

export function registerRunCmd(
  program: Command,
  services: ServicesPort,
): Command {
  program
    .command("run <flowPath>")
    .description("run a workflow definition from a flow.json file")
    .action(async (flowPath) => {
      await cliRunAction(services, flowPath);
    });

  return program;
}
