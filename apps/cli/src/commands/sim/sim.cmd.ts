import { WorkflowController } from "@lcase/controller";
import { Command } from "commander";

export async function cliSimAction(
  controller: WorkflowController,
  runId: string,
  reusedSteps: string[],
): Promise<void> {
  console.log("[cli] running replay command");
  await controller.startRuntime();
  await controller.forkSpec.runForkedSim(runId, reusedSteps, "lowercase://cli");
  await new Promise((res) => {
    setTimeout(res, 10000);
  });
}

export function registerSimCmd(
  program: Command,
  controller: WorkflowController,
): Command {
  program
    .command("sim <forkRunId>")
    .description("replay a run without side effects")
    .option("-r, --reuse <reuse...>")
    .action(async (forkRunId: string, options) => {
      await cliSimAction(controller, forkRunId, options.reuse);
    });
  return program;
}
