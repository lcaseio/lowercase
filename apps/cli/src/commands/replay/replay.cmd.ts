import { WorkflowController } from "@lcase/controller";
import { Command } from "commander";

export async function cliReplayAction(
  controller: WorkflowController,
  runId: string
): Promise<void> {
  console.log("[cli] running replay command");
  await controller.startRuntime();
  await controller.replayRun(runId);
}

export function registerReplayCmd(
  program: Command,
  controller: WorkflowController
): Command {
  program
    .command("replay <runId>")
    .description("replay a run without side effects")
    .action(async (runId: string) => {
      await cliReplayAction(controller, runId);
    });
  return program;
}
