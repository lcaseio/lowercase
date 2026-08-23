import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@lcase/db-prisma";
import { PrismaFlowRepository } from "../../src/flow-repository/prisma-flow-repository.js";
import { PrismaSimRepository } from "../../src/sim-repository/prisma-sim-repository.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../../..");

async function applySqlFile(
  prisma: { $executeRawUnsafe: (sql: string) => Promise<unknown> },
  filePath: string,
) {
  const sql = await fs.readFile(filePath, "utf8");
  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function applyMigrations(
  prisma: { $executeRawUnsafe: (sql: string) => Promise<unknown> },
  migrationsDir: string,
) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const migrationFiles = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(migrationsDir, entry.name, "migration.sql"))
    .sort();

  for (const filePath of migrationFiles) {
    await applySqlFile(prisma, filePath);
  }
}

describe("PrismaSimRepository", () => {
  let tmpDir: string;
  let prisma: PrismaClient;
  let repository: PrismaSimRepository;
  let flowRepository: PrismaFlowRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-sim-repo-"));
    const dbPath = path.join(tmpDir, "sim-repository.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.join(repoRoot, "packages/db-prisma/prisma/migrations"),
    );

    repository = new PrismaSimRepository(prisma);
    flowRepository = new PrismaFlowRepository(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates and reads a sim record", async () => {
    const flowResult = await flowRepository.createFlow({
      name: "Prompt Flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    expect(flowResult.ok).toBe(true);
    if (!flowResult.ok) return;

    const result = await repository.createSim({
      name: "Reuse Fetch",
      flowId: flowResult.value.flow.id,
      flowVersionId: flowResult.value.version.id,
      forkSpecHash: "b".repeat(64),
    });

    expect(result.ok).toBe(true);
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: expect.any(String),
        name: "Reuse Fetch",
        flowId: flowResult.value.flow.id,
        flowVersionId: flowResult.value.version.id,
        forkSpecHash: "b".repeat(64),
      }),
    });

    if (!result.ok) return;
    await expect(repository.getSim(result.value.id)).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        id: result.value.id,
        name: "Reuse Fetch",
      }),
    });
  });

  it("rejects a flow version that belongs to another flow", async () => {
    const firstFlow = await flowRepository.createFlow({
      name: "Flow A",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    const secondFlow = await flowRepository.createFlow({
      name: "Flow B",
      definitionHash: "b".repeat(64),
      versionLabel: "v1",
    });

    expect(firstFlow.ok).toBe(true);
    expect(secondFlow.ok).toBe(true);
    if (!firstFlow.ok || !secondFlow.ok) return;

    const result = await repository.createSim({
      name: "Bad Sim",
      flowId: firstFlow.value.flow.id,
      flowVersionId: secondFlow.value.version.id,
      forkSpecHash: "c".repeat(64),
    });

    expect(result).toEqual({
      ok: false,
      error: "Flow version does not belong to the supplied flow",
    });
  });

  it("lists sims newest first with flow and version summaries", async () => {
    const firstFlow = await flowRepository.createFlow({
      name: "Flow A",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    const secondFlow = await flowRepository.createFlow({
      name: "Flow B",
      definitionHash: "b".repeat(64),
      versionLabel: "v2",
    });
    expect(firstFlow.ok).toBe(true);
    expect(secondFlow.ok).toBe(true);
    if (!firstFlow.ok || !secondFlow.ok) return;

    const firstSim = await repository.createSim({
      name: "First Sim",
      flowId: firstFlow.value.flow.id,
      flowVersionId: firstFlow.value.version.id,
      forkSpecHash: "1".repeat(64),
    });
    const secondSim = await repository.createSim({
      name: "Second Sim",
      flowId: secondFlow.value.flow.id,
      flowVersionId: secondFlow.value.version.id,
      forkSpecHash: "2".repeat(64),
    });
    expect(firstSim.ok).toBe(true);
    expect(secondSim.ok).toBe(true);

    const sims = await repository.listSimsWithFlowVersion();
    expect(sims).toHaveLength(2);
    expect(sims[0]).toEqual({
      sim: expect.objectContaining({
        name: "Second Sim",
        flowId: secondFlow.value.flow.id,
        flowVersionId: secondFlow.value.version.id,
      }),
      flow: expect.objectContaining({
        id: secondFlow.value.flow.id,
        name: "Flow B",
      }),
      flowVersion: expect.objectContaining({
        id: secondFlow.value.version.id,
        versionLabel: "v2",
      }),
    });
    expect(sims[1]?.sim.name).toBe("First Sim");
  });

  it("lists only sims matching the given flow version id", async () => {
    const firstFlow = await flowRepository.createFlow({
      name: "Flow A",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    const secondFlow = await flowRepository.createFlow({
      name: "Flow B",
      definitionHash: "b".repeat(64),
      versionLabel: "v2",
    });
    expect(firstFlow.ok).toBe(true);
    expect(secondFlow.ok).toBe(true);
    if (!firstFlow.ok || !secondFlow.ok) return;

    await repository.createSim({
      name: "First Sim",
      flowId: firstFlow.value.flow.id,
      flowVersionId: firstFlow.value.version.id,
      forkSpecHash: "1".repeat(64),
    });
    await repository.createSim({
      name: "Second Sim",
      flowId: secondFlow.value.flow.id,
      flowVersionId: secondFlow.value.version.id,
      forkSpecHash: "2".repeat(64),
    });

    const sims = await repository.listSimsByFlowVersionId(
      firstFlow.value.version.id,
    );
    expect(sims).toHaveLength(1);
    expect(sims[0]?.sim.name).toBe("First Sim");
  });
});
