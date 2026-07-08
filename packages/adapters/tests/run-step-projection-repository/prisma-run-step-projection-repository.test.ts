import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@lcase/db-prisma";
import { PrismaRunRepository } from "../../src/run-repository/prisma-run-repository.js";
import { PrismaRunStepProjectionRepository } from "../../src/run-step-projection-repository/prisma-run-step-projection-repository.js";

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

describe("PrismaRunStepProjectionRepository", () => {
  let tmpDir: string;
  let prisma: PrismaClient;
  let runRepository: PrismaRunRepository;
  let repository: PrismaRunStepProjectionRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-run-step-repo-"));
    const dbPath = path.join(tmpDir, "test.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.join(repoRoot, "packages/db-prisma/prisma/migrations"),
    );

    runRepository = new PrismaRunRepository(prisma);
    repository = new PrismaRunStepProjectionRepository(prisma);

    await runRepository.createRun({
      id: "run-step-test",
      traceId: "trace-step",
      status: "requested",
      source: "lowercase://test",
      flowDefHash: "a".repeat(64),
    });
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("upserts and reads a step projection", async () => {
    const result = await repository.upsertStepProjection({
      runId: "run-step-test",
      stepId: "fetch",
      status: "started",
      startTime: "2026-07-02T10:00:00.000Z",
      outputHash: "b".repeat(64),
      exportHashes: { body: "c".repeat(64) },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      runId: "run-step-test",
      stepId: "fetch",
      status: "started",
      startTime: "2026-07-02T10:00:00.000Z",
      outputHash: "b".repeat(64),
      exports: [{ name: "body", artifactHash: "c".repeat(64) }],
    });

    await expect(
      repository.getStepProjection("run-step-test", "fetch"),
    ).resolves.toEqual({
      ok: true,
      value: {
        runId: "run-step-test",
        stepId: "fetch",
        status: "started",
        startTime: "2026-07-02T10:00:00.000Z",
        outputHash: "b".repeat(64),
        exports: [{ name: "body", artifactHash: "c".repeat(64) }],
      },
    });
  });

  it("updates an existing step projection row", async () => {
    await repository.upsertStepProjection({
      runId: "run-step-test",
      stepId: "fetch",
      status: "started",
      startTime: "2026-07-02T10:00:00.000Z",
    });

    const result = await repository.upsertStepProjection({
      runId: "run-step-test",
      stepId: "fetch",
      status: "success",
      endTime: "2026-07-02T10:00:03.000Z",
      duration: 3,
      wasReused: true,
      reusedTime: "2026-07-02T10:00:02.000Z",
      exportHashes: { body: "d".repeat(64) },
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        runId: "run-step-test",
        stepId: "fetch",
        status: "success",
        endTime: "2026-07-02T10:00:03.000Z",
        duration: 3,
        wasReused: true,
        reusedTime: "2026-07-02T10:00:02.000Z",
        exports: [{ name: "body", artifactHash: "d".repeat(64) }],
      }),
    });
  });

  it("lists step projections by run in step order", async () => {
    await repository.upsertStepProjection({
      runId: "run-step-test",
      stepId: "zeta",
      status: "success",
    });
    await repository.upsertStepProjection({
      runId: "run-step-test",
      stepId: "alpha",
      status: "failed",
    });

    const steps = await repository.listStepProjections("run-step-test");
    expect(steps.map((step) => step.stepId)).toEqual(["alpha", "zeta"]);
  });
});
