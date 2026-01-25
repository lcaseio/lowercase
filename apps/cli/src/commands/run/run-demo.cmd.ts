import { Command } from "commander";
import { resolveCliPath } from "../../resolve-path.js";
import { startDemoServers } from "./demo.js";

import { McpManager } from "@lcase/adapters/mcp-manager";
import { WorkflowController } from "@lcase/controller";
import { ServicesPort } from "@lcase/ports";

export async function cliRunDemoAction(
  services: ServicesPort,
  flowPath: string,
): Promise<void> {
  console.log("[cli] running rundemo command");
  await services.system.startSystem();
  const resolvedFlowPath = resolveCliPath(flowPath);

  const mcpStore = new McpManager();
  const managedProcesses = await startDemoServers();

  if (!managedProcesses) {
    console.error("[cli-run] error starting servers for demo");
  }
  await mcpStore.addSseClient(
    "http://localhost:3004/sse",
    "unicode",
    "unicode-client",
    "0.1.0-alpha.7",
  );
  await mcpStore.addSseClient(
    "http://localhost:3005/sse",
    "transform",
    "transform-client",
    "0.1.0-alpha.7",
  );

  process.once("SIGINT", async () => {
    await mcpStore.close("unicode");
    await mcpStore.close("transform");
  });
  process.once("SIGTERM", async () => {
    await mcpStore.close("unicode");
    await mcpStore.close("transform");
  });

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

  await services.flow.startFlow({ absoluteFilePath: resolvedFlowPath });
}

export function registerRunDemoCmd(
  program: Command,
  services: ServicesPort,
): Command {
  program
    .command("rundemo <flowPath>")
    .description("run a workflow definition from a flow.json file")
    .action(async (flowPath) => {
      await cliRunDemoAction(services, flowPath);
    });

  return program;
}
