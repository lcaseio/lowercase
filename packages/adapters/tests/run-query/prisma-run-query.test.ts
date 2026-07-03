import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@lcase/db-prisma";
import { PrismaRunQuery } from "../../src/run-query/prisma-run-query.js";

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

describe("PrismaRunQuery", () => {
  let tmpDir: string;
  let prisma: PrismaClient;
  let query: PrismaRunQuery;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-run-query-"));
    const dbPath = path.join(tmpDir, "test.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.join(repoRoot, "packages/db-prisma/prisma/migrations"),
    );

    query = new PrismaRunQuery(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("lists runs with flow metadata resolved by definition hash", async () => {
    const createdAt = new Date("2026-07-02T10:00:00.000Z");

    await prisma.flow.create({
      data: {
        id: "flow-1",
        name: "Prompt Flow",
        createdAt,
        updatedAt: createdAt,
        versions: {
          create: {
            id: "flow-version-1",
            sequence: 1,
            definitionHash: "a".repeat(64),
            versionLabel: "v1",
            createdAt,
          },
        },
      },
    });

    await prisma.run.create({
      data: {
        id: "run-1",
        traceId: "trace-1",
        status: "completed",
        source: "lowercase://test",
        flowDefHash: "a".repeat(64),
        forkSpecHash: "b".repeat(64),
        startTime: new Date("2026-07-02T10:00:01.000Z"),
        endTime: new Date("2026-07-02T10:00:05.000Z"),
        duration: 4,
      },
    });

    const result = await query.listRuns();

    expect(result).toEqual([
      {
        runId: "run-1",
        flowName: "Prompt Flow",
        flowVersion: "v1",
        flowDefHash: "a".repeat(64),
        startTime: "2026-07-02T10:00:01.000Z",
        endTime: "2026-07-02T10:00:05.000Z",
        duration: 4,
        forkSpecHash: "b".repeat(64),
        parentId: undefined,
      },
    ]);
  });

  it("returns run detail with step projections", async () => {
    const createdAt = new Date("2026-07-02T10:00:00.000Z");

    await prisma.flow.create({
      data: {
        id: "flow-2",
        name: "Detail Flow",
        createdAt,
        updatedAt: createdAt,
        versions: {
          create: {
            id: "flow-version-2",
            sequence: 1,
            definitionHash: "c".repeat(64),
            versionLabel: "v2",
            createdAt,
          },
        },
      },
    });

    await prisma.run.create({
      data: {
        id: "run-2",
        traceId: "trace-2",
        status: "completed",
        source: "lowercase://detail",
        flowDefHash: "c".repeat(64),
        startTime: new Date("2026-07-02T10:00:01.000Z"),
        endTime: new Date("2026-07-02T10:00:03.000Z"),
        duration: 2,
      },
    });

    await prisma.runStepProjection.create({
      data: {
        runId: "run-2",
        stepId: "fetch",
        status: "completed",
        outputHash: "d".repeat(64),
        exportHashes: JSON.stringify({ body: "e".repeat(64) }),
      },
    });

    const result = await query.getRunDetail("run-2");

    expect(result).toEqual({
      ok: true,
      value: {
        run: expect.objectContaining({
          id: "run-2",
          flowDefHash: "c".repeat(64),
          status: "completed",
        }),
        steps: [
          {
            runId: "run-2",
            stepId: "fetch",
            status: "completed",
            outputHash: "d".repeat(64),
            exportHashes: { body: "e".repeat(64) },
          },
        ],
        flow: expect.objectContaining({
          id: "flow-2",
          name: "Detail Flow",
        }),
        flowVersion: expect.objectContaining({
          id: "flow-version-2",
          definitionHash: "c".repeat(64),
          versionLabel: "v2",
        }),
      },
    });
  });

  it("returns not found for a missing run", async () => {
    await expect(query.getRunDetail("missing-run")).resolves.toEqual({
      ok: false,
      error: "Run not found: missing-run",
    });
  });

  it("returns detail even when flow metadata is missing", async () => {
    await prisma.run.create({
      data: {
        id: "run-3",
        traceId: "trace-3",
        status: "requested",
        source: "lowercase://orphan",
        flowDefHash: "f".repeat(64),
      },
    });

    const result = await query.getRunDetail("run-3");

    expect(result).toEqual({
      ok: true,
      value: {
        run: expect.objectContaining({
          id: "run-3",
          flowDefHash: "f".repeat(64),
        }),
        steps: [],
        flow: undefined,
        flowVersion: undefined,
      },
    });
  });
});
