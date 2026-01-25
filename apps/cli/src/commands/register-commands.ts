import type { Command } from "commander";
import { registerRunCmd } from "./run/run.cmd.js";
import { registerValidateCmd } from "./validate/validate.js";
import { registerRunDemoCmd } from "./run/run-demo.cmd.js";
import { WorkflowController } from "@lcase/controller";
import { registerReplayCmd } from "./replay/replay.cmd.js";
import { registerSimCmd } from "./sim/sim.cmd.js";

export function registerCommands(
  program: Command,
  controller: WorkflowController,
) {
  registerRunCmd(program, controller);
  registerRunDemoCmd(program, controller);
  registerValidateCmd(program, controller);
  registerReplayCmd(program, controller);
  registerSimCmd(program, controller);
}
