import { buildServer } from "./build-server.js";

async function main() {
  const server = await buildServer();

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const host = process.env.HOST || "127.0.0.1";
  try {
    await server.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

await main();
