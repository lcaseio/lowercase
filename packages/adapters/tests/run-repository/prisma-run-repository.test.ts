import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@lcase/db-prisma";
import { PrismaRunRepository } from "../../src/run-repository/prisma-run-repository.js";

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

describe("PrismaRunRepository", () => {
  let tmpDir: string;
  let prisma: PrismaClient;
  let repository: PrismaRunRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-run-repo-"));
    const dbPath = path.join(tmpDir, "test.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.join(repoRoot, "packages/db-prisma/prisma/migrations"),
    );

    repository = new PrismaRunRepository(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates and reads a run record", async () => {
    const result = await repository.createRun({
      id: "run-test-1",
      traceId: "trace-1",
      status: "requested",
      source: "lowercase://test",
      flowDefHash: "a".repeat(64),
      forkSpecHash: "b".repeat(64),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual(
      expect.objectContaining({
        id: "run-test-1",
        traceId: "trace-1",
        status: "requested",
        source: "lowercase://test",
        flowDefHash: "a".repeat(64),
        forkSpecHash: "b".repeat(64),
      }),
    );

    await expect(repository.getRun("run-test-1")).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({
        id: "run-test-1",
        status: "requested",
      }),
    });
  });

  it("updates lifecycle fields for an existing run", async () => {
    await repository.createRun({
      id: "run-test-2",
      traceId: "trace-2",
      status: "requested",
      source: "lowercase://test",
      flowDefHash: "c".repeat(64),
    });

    const result = await repository.updateRun({
      id: "run-test-2",
      status: "completed",
      startTime: "2026-07-02T10:00:00.000Z",
      endTime: "2026-07-02T10:00:05.000Z",
      duration: 5,
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: "run-test-2",
        status: "completed",
        startTime: "2026-07-02T10:00:00.000Z",
        endTime: "2026-07-02T10:00:05.000Z",
        duration: 5,
      }),
    });
  });

  it("lists runs newest first", async () => {
    await repository.createRun({
      id: "run-first",
      traceId: "trace-first",
      status: "requested",
      source: "lowercase://test",
      flowDefHash: "d".repeat(64),
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    await repository.createRun({
      id: "run-second",
      traceId: "trace-second",
      status: "requested",
      source: "lowercase://test",
      flowDefHash: "e".repeat(64),
    });

    const runs = await repository.listRuns();
    expect(runs.map((run) => run.id)).toEqual(["run-second", "run-first"]);
  });

  it("upserts when createRun is called again for the same run id", async () => {
    await repository.createRun({
      id: "run-test-3",
      traceId: "trace-3",
      status: "requested",
      source: "lowercase://test",
      flowDefHash: "f".repeat(64),
    });

    const result = await repository.createRun({
      id: "run-test-3",
      traceId: "trace-3",
      status: "started",
      source: "lowercase://updated",
      flowDefHash: "f".repeat(64),
      startTime: "2026-07-02T10:00:00.000Z",
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        id: "run-test-3",
        status: "started",
        source: "lowercase://updated",
        startTime: "2026-07-02T10:00:00.000Z",
      }),
    });
  });
});
