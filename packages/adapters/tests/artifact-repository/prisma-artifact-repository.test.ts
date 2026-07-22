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

  it("put() called again on the same hash does not clear an existing flowId/flowVersionId association", async () => {
    // simulates the exact real-world case: a run later produces byte-
    // identical content to something already curated -- the worker's put()
    // call has no way to reach flowId/flowVersionId at all (excluded from
    // ArtifactIndexInput), so this must be a true no-op on those columns
    const flow = await prisma.flow.create({ data: { name: "Test Flow" } });
    const flowVersion = await prisma.flowVersion.create({
      data: { flowId: flow.id, sequence: 1, definitionHash: "h".repeat(64) },
    });

    await repository.saveArtifact({
      hash: "a".repeat(64),
      time: "2026-06-30T00:00:00.000Z",
      format: "json",
    });
    await repository.associateArtifact("a".repeat(64), {
      flowId: flow.id,
      flowVersionId: flowVersion.id,
    });

    const result = await repository.saveArtifact({
      hash: "a".repeat(64),
      time: "2026-07-01T00:00:00.000Z",
      format: "json",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.flowId).toBe(flow.id);
    expect(result.value.flowVersionId).toBe(flowVersion.id);
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

  describe("listArtifacts filter", () => {
    it("with no filter, returns everything (unchanged behavior)", async () => {
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2025-01-01T00:00:00.000Z",
        format: "json",
      });
      await repository.saveArtifact({
        hash: "b".repeat(64),
        time: "2026-01-01T00:00:00.000Z",
        format: "json",
      });

      const artifacts = await repository.listArtifacts();
      expect(artifacts).toHaveLength(2);
    });

    it("filters by curated", async () => {
      const { flow, flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2025-01-01T00:00:00.000Z",
        format: "json",
      });
      await repository.saveArtifact({
        hash: "b".repeat(64),
        time: "2026-01-01T00:00:00.000Z",
        format: "json",
      });
      await repository.associateArtifact("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        curated: true,
      });

      const curated = await repository.listArtifacts({ curated: true });
      expect(curated.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);

      const uncurated = await repository.listArtifacts({ curated: false });
      expect(uncurated.map((artifact) => artifact.hash)).toEqual([
        "b".repeat(64),
      ]);
    });

    it("filters by flowId and flowVersionId, and combines with curated", async () => {
      const { flow, flowVersion } = await createFlowAndVersion();
      const otherFlow = await prisma.flow.create({
        data: { name: "Other Flow" },
      });
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2025-01-01T00:00:00.000Z",
        format: "json",
      });
      await repository.saveArtifact({
        hash: "b".repeat(64),
        time: "2026-01-01T00:00:00.000Z",
        format: "json",
      });
      await repository.associateArtifact("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        curated: true,
      });
      await repository.associateArtifact("b".repeat(64), {
        flowId: otherFlow.id,
        curated: true,
      });

      const byFlow = await repository.listArtifacts({ flowId: flow.id });
      expect(byFlow.map((artifact) => artifact.hash)).toEqual(["a".repeat(64)]);

      const byVersion = await repository.listArtifacts({
        flowVersionId: flowVersion.id,
      });
      expect(byVersion.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);

      const combined = await repository.listArtifacts({
        flowId: flow.id,
        curated: true,
      });
      expect(combined.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);
    });
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

  async function createFlowAndVersion() {
    const flow = await prisma.flow.create({
      data: { name: "Test Flow" },
    });
    const flowVersion = await prisma.flowVersion.create({
      data: { flowId: flow.id, sequence: 1, definitionHash: "h".repeat(64) },
    });
    return { flow, flowVersion };
  }

  describe("associateArtifact", () => {
    it("an empty association object is a safe no-op, not an insert or error", async () => {
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        label: "original",
        format: "json",
      });

      const result = await repository.associateArtifact("a".repeat(64), {});

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.label).toBe("original");
      expect(result.value.flowId).toBeUndefined();
      expect(result.value.flowVersionId).toBeUndefined();
    });

    it("sets flowId and flowVersionId on an existing artifact", async () => {
      const { flow, flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      const result = await repository.associateArtifact("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.flowId).toBe(flow.id);
      expect(result.value.flowVersionId).toBe(flowVersion.id);
    });

    it("leaves omitted fields unchanged, and clears a field set to null", async () => {
      const { flow, flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.associateArtifact("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
      });

      const result = await repository.associateArtifact("a".repeat(64), {
        flowVersionId: null,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.flowId).toBe(flow.id);
      expect(result.value.flowVersionId).toBeUndefined();
    });

    it("fails for a hash that doesn't exist", async () => {
      const result = await repository.associateArtifact("z".repeat(64), {
        flowId: "nonexistent",
      });
      expect(result.ok).toBe(false);
    });

    it("new artifacts default to curated: false", async () => {
      const saveResult = await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;
      expect(saveResult.value.curated).toBe(false);
    });

    it("sets curated to true, and back to false, only through associateArtifact", async () => {
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      const curated = await repository.associateArtifact("a".repeat(64), {
        curated: true,
      });
      expect(curated.ok).toBe(true);
      if (curated.ok) expect(curated.value.curated).toBe(true);

      const uncurated = await repository.associateArtifact("a".repeat(64), {
        curated: false,
      });
      expect(uncurated.ok).toBe(true);
      if (uncurated.ok) expect(uncurated.value.curated).toBe(false);
    });

    it("put() called again on the same hash does not clear an existing curated flag", async () => {
      // mirrors the flowId/flowVersionId case below -- the worker's put()
      // path has no way to reach curated at all (excluded from
      // ArtifactIndexInput), so a run later producing byte-identical
      // content must not be able to un-curate it
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.associateArtifact("a".repeat(64), { curated: true });

      const result = await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-07-01T00:00:00.000Z",
        format: "json",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.curated).toBe(true);
    });
  });

  describe("param curation", () => {
    it("curates an artifact for a param, then lists it", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      const curateResult = await repository.curateArtifactForParam({
        artifactHash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "weatherApiKey",
      });
      expect(curateResult.ok).toBe(true);

      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);
    });

    it("curating the same artifact/param twice is idempotent", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      await repository.curateArtifactForParam({
        artifactHash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "weatherApiKey",
      });
      const secondResult = await repository.curateArtifactForParam({
        artifactHash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "weatherApiKey",
      });

      expect(secondResult.ok).toBe(true);
      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated).toHaveLength(1);
    });

    it("uncurates an artifact, removing it from the list", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.curateArtifactForParam({
        artifactHash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "weatherApiKey",
      });

      const uncurateResult = await repository.uncurateArtifactForParam({
        artifactHash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "weatherApiKey",
      });
      expect(uncurateResult.ok).toBe(true);

      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated).toEqual([]);
    });

    it("scopes curated artifacts by paramName within the same flow version", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.saveArtifact({
        hash: "b".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.curateArtifactForParam({
        artifactHash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "weatherApiKey",
      });
      await repository.curateArtifactForParam({
        artifactHash: "b".repeat(64),
        flowVersionId: flowVersion.id,
        paramName: "otherParam",
      });

      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);
    });
  });
});
