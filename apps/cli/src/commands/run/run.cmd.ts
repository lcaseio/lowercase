import { Command } from "commander";
import { ServicesPort } from "@lcase/ports";

export async function cliRunAction(
  services: ServicesPort,
  flowDefHash: string,
): Promise<void> {
  console.log("[cli] running run command");
  await services.system.startSystem();
  await services.run.requestRun(flowDefHash, "lowercase://cli");
}

export function registerRunCmd(
  program: Command,
  services: ServicesPort,
): Command {
  program
    .command("run <flowDefHash>")
    .description("run a workflow definition from a flow.json file")
    .action(async (flowDefHash) => {
      await cliRunAction(services, flowDefHash);
    });

  return program;
}
