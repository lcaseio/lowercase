import { Command } from "commander";
import { ServicesPort } from "@lcase/ports";

export async function cliRunAction(
  services: ServicesPort,
  flowId: string,
  flowVersionId: string,
  flowDefHash: string,
): Promise<void> {
  console.log("[cli] running run command");
  await services.system.startSystem();
  await services.run.requestRun({
    flowId,
    flowVersionId,
    flowDefHash,
    source: "lowercase://cli",
  });
}

export function registerRunCmd(
  program: Command,
  services: ServicesPort,
): Command {
  program
    .command("run <flowId> <flowVersionId> <flowDefHash>")
    .description("run a workflow definition using relational flow metadata")
    .action(async (flowId, flowVersionId, flowDefHash) => {
      await cliRunAction(services, flowId, flowVersionId, flowDefHash);
    });

  return program;
}
