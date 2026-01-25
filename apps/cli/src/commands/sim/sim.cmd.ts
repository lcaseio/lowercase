import { WorkflowController } from "@lcase/controller";
import { ServicesPort } from "@lcase/ports";
import { Command } from "commander";

export async function cliSimAction(
  services: ServicesPort,
  runId: string,
  reusedSteps: string[],
): Promise<void> {
  console.log("[cli] running replay command");
  await services.system.startSystem();
  await services.sim.startForkedRunSim(runId, reusedSteps, "lowercase://cli");
}

export function registerSimCmd(
  program: Command,
  services: ServicesPort,
): Command {
  program
    .command("sim <forkRunId>")
    .description("replay a run without side effects")
    .option("-r, --reuse <reuse...>")
    .action(async (forkRunId: string, options) => {
      await cliSimAction(services, forkRunId, options.reuse);
    });
  return program;
}
