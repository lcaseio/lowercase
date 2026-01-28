#!/usr/bin/env node
import { Command } from "commander";
import { registerCommands } from "./commands/register-commands.js";
import { bootstrap } from "./bootstrap.js";

async function main(): Promise<void> {
  const services = bootstrap();
  const program = new Command();
  program.description("cli tool for lowercase workflows");
  registerCommands(program, services);
  await program.parseAsync();

  let isRunning = false;
  process.once("SIGINT", async () => {
    if (isRunning) await services.system.stopSystem();
    isRunning = false;
  });
  process.once("SIGTERM", async () => {
    if (isRunning) await services.system.stopSystem();
    isRunning = false;
  });
  process.once("exit", async () => {
    if (isRunning) await services.system.stopSystem();
    isRunning = false;
  });
}

(async () => await main())();
