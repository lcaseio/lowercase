import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@lcase/db-prisma";
import { PrismaArtifactRepository } from "../../src/artifact-repository/prisma-artifact-repository.js";

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

describe("PrismaArtifactRepository", () => {
  let tmpDir: string;
  let prisma: PrismaClient;
  let repository: PrismaArtifactRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-artifact-repo-"));
    const dbPath = path.join(tmpDir, "test.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.resolve(process.cwd(), "../db-prisma/prisma/migrations"),
    );

    repository = new PrismaArtifactRepository(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("saves and reads artifact metadata by hash", async () => {
    const result = await repository.saveArtifact({
      hash: "a".repeat(64),
      time: "2026-06-30T00:00:00.000Z",
      label: "Prompt",
      filename: "prompt.md",
      contentType: "text/markdown",
      size: 42,
      format: "markdown",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const artifact = await repository.getArtifact("a".repeat(64));
    expect(artifact).toEqual(result.value);
  });

  it("lists artifact metadata newest first", async () => {
    await repository.saveArtifact({
      hash: "a".repeat(64),
      time: "2025-01-01T00:00:00.000Z",
      format: "json",
    });
    await repository.saveArtifact({
      hash: "b".repeat(64),
      time: "2026-01-01T00:00:00.000Z",
      format: "text",
    });

    const artifacts = await repository.listArtifacts();
    expect(artifacts.map((artifact) => artifact.hash)).toEqual([
      "b".repeat(64),
      "a".repeat(64),
    ]);
  });

  it("lists artifact hashes newest first", async () => {
    await repository.saveArtifact({
      hash: "a".repeat(64),
      time: "2025-01-01T00:00:00.000Z",
      format: "json",
    });
    await repository.saveArtifact({
      hash: "c".repeat(64),
      time: "2027-01-01T00:00:00.000Z",
      format: "bytes",
    });

    const hashes = await repository.listArtifactHashes();
    expect(hashes).toEqual(["c".repeat(64), "a".repeat(64)]);
  });
});
