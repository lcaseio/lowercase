import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@lcase/db-prisma";
import { PrismaFlowRepository } from "../../src/flow-repository/prisma-flow-repository.js";

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

describe("PrismaFlowRepository", () => {
  let tmpDir: string;
  let prisma: PrismaClient;
  let repository: PrismaFlowRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-flow-repo-"));
    const dbPath = path.join(tmpDir, "test.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.resolve(
        process.cwd(),
        "../db-prisma/prisma/migrations",
      ),
    );

    repository = new PrismaFlowRepository(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates a stable flow with its first version", async () => {
    const result = await repository.createFlow({
      name: "Prompt Flow",
      description: "Reusable prompt flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
      versionDescription: "Initial version",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.flow.name).toBe("Prompt Flow");
    expect(result.value.flow.description).toBe("Reusable prompt flow");
    expect(result.value.version.sequence).toBe(1);
    expect(result.value.version.definitionHash).toBe("a".repeat(64));
    expect(result.value.version.versionLabel).toBe("v1");
    expect(result.value.version.flowId).toBe(result.value.flow.id);
  });

  it("lists flows newest first", async () => {
    const first = await repository.createFlow({
      name: "First Flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    const second = await repository.createFlow({
      name: "Second Flow",
      definitionHash: "b".repeat(64),
      versionLabel: "v1",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const flows = await repository.listFlows();
    expect(flows.map((flow) => flow.name)).toEqual(["Second Flow", "First Flow"]);
  });

  it("lists flows with latest version summary", async () => {
    const created = await repository.createFlow({
      name: "Prompt Flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await prisma.flowVersion.create({
      data: {
        flowId: created.value.flow.id,
        sequence: 2,
        definitionHash: "b".repeat(64),
        versionLabel: "v2",
      },
    });

    const flows = await repository.listFlowsWithLatestVersion();
    expect(flows).toHaveLength(1);
    expect(flows[0]?.flow.name).toBe("Prompt Flow");
    expect(flows[0]?.latestVersion.sequence).toBe(2);
    expect(flows[0]?.latestVersion.definitionHash).toBe("b".repeat(64));
  });

  it("lists versions ordered by sequence", async () => {
    const created = await repository.createFlow({
      name: "Versioned Flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await prisma.flowVersion.create({
      data: {
        flowId: created.value.flow.id,
        sequence: 2,
        definitionHash: "b".repeat(64),
        versionLabel: "v2",
      },
    });

    const versions = await repository.listFlowVersions(created.value.flow.id);
    expect(versions.map((version) => version.sequence)).toEqual([1, 2]);
    expect(versions.map((version) => version.definitionHash)).toEqual([
      "a".repeat(64),
      "b".repeat(64),
    ]);
  });

  it("resolves a version to its definition hash", async () => {
    const created = await repository.createFlow({
      name: "Hash Flow",
      definitionHash: "c".repeat(64),
      versionLabel: "v1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const hash = await repository.getFlowVersionDefinitionHash(
      created.value.version.id,
    );
    expect(hash).toEqual({ ok: true, value: "c".repeat(64) });
  });

  it("gets version metadata by id", async () => {
    const created = await repository.createFlow({
      name: "Version Flow",
      definitionHash: "d".repeat(64),
      versionLabel: "v1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const version = await repository.getFlowVersion(created.value.version.id);
    expect(version).toEqual({
      ok: true,
      value: created.value.version,
    });
  });
});
