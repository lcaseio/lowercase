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
    await repository.updateMetadata("a".repeat(64), {
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
    expect(artifacts.map((item) => item.artifact.hash)).toEqual([
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
      // updateMetadata always sets curated: true as a side effect -- "b"
      // stays uncurated simply by never having updateMetadata called on it
      await repository.updateMetadata("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
      });

      const curated = await repository.listArtifacts({ curated: true });
      expect(curated.map((item) => item.artifact.hash)).toEqual([
        "a".repeat(64),
      ]);

      const uncurated = await repository.listArtifacts({ curated: false });
      expect(uncurated.map((item) => item.artifact.hash)).toEqual([
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
      await repository.updateMetadata("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
      });
      await repository.updateMetadata("b".repeat(64), {
        flowId: otherFlow.id,
      });

      const byFlow = await repository.listArtifacts({ flowId: flow.id });
      expect(byFlow.map((item) => item.artifact.hash)).toEqual([
        "a".repeat(64),
      ]);

      const byVersion = await repository.listArtifacts({
        flowVersionId: flowVersion.id,
      });
      expect(byVersion.map((item) => item.artifact.hash)).toEqual([
        "a".repeat(64),
      ]);

      const combined = await repository.listArtifacts({
        flowId: flow.id,
        curated: true,
      });
      expect(combined.map((item) => item.artifact.hash)).toEqual([
        "a".repeat(64),
      ]);
    });

    it("includes paramCurations when scoped by flowVersionId, empty for uncurated artifacts", async () => {
      const { flowVersion } = await createFlowAndVersion();
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
      // listArtifacts filters on the Artifact row's own flowVersionId column,
      // which is independent of the join-table's per-curation flowVersionId --
      // both must be set for an artifact to show up in a version-scoped list.
      // paramCurations is full-replace, so both params go in one call.
      await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey", "otherParam"],
      });
      await repository.updateMetadata("b".repeat(64), {
        flowVersionId: flowVersion.id,
      });

      const items = await repository.listArtifacts({
        flowVersionId: flowVersion.id,
      });
      const curatedItem = items.find(
        (item) => item.artifact.hash === "a".repeat(64),
      );
      const uncuratedItem = items.find(
        (item) => item.artifact.hash === "b".repeat(64),
      );

      expect(curatedItem?.associations.paramCurations).toEqual(
        expect.arrayContaining([
          { flowVersionId: flowVersion.id, paramName: "weatherApiKey" },
          { flowVersionId: flowVersion.id, paramName: "otherParam" },
        ]),
      );
      expect(curatedItem?.associations.paramCurations).toHaveLength(2);
      expect(uncuratedItem?.associations.paramCurations).toEqual([]);
    });

    it("leaves paramCurations empty for every item when no flowVersionId filter is given, even if curations exist", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2025-01-01T00:00:00.000Z",
        format: "json",
      });
      await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });

      const items = await repository.listArtifacts();
      expect(
        items.every((item) => item.associations.paramCurations.length === 0),
      ).toBe(true);
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

  describe("updateMetadata", () => {
    it("an empty object leaves label/flowId/flowVersionId unchanged, but still marks the artifact curated", async () => {
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        label: "original",
        format: "json",
      });

      const result = await repository.updateMetadata("a".repeat(64), {});

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.label).toBe("original");
      expect(result.value.flowId).toBeUndefined();
      expect(result.value.flowVersionId).toBeUndefined();
      expect(result.value.curated).toBe(true);
    });

    it("sets flowId and flowVersionId on an existing artifact", async () => {
      const { flow, flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      const result = await repository.updateMetadata("a".repeat(64), {
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
      await repository.updateMetadata("a".repeat(64), {
        flowId: flow.id,
        flowVersionId: flowVersion.id,
      });

      const result = await repository.updateMetadata("a".repeat(64), {
        flowVersionId: null,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.flowId).toBe(flow.id);
      expect(result.value.flowVersionId).toBeUndefined();
    });

    it("fails for a hash that doesn't exist", async () => {
      const result = await repository.updateMetadata("z".repeat(64), {
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

    it("always sets curated to true, regardless of what's passed, and it can never be set back to false", async () => {
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      const result = await repository.updateMetadata("a".repeat(64), {
        label: "just a label change",
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.curated).toBe(true);

      // ArtifactMetadata has no `curated` field at all -- there is no way to
      // pass anything that would set it back to false through this method
    });

    it("put() called again on the same hash does not clear an existing curated flag", async () => {
      // mirrors the flowId/flowVersionId case above -- the worker's put()
      // path has no way to reach curated at all (excluded from
      // ArtifactIndexInput), so a run later producing byte-identical
      // content must not be able to un-curate it
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.updateMetadata("a".repeat(64), {});

      const result = await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-07-01T00:00:00.000Z",
        format: "json",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.curated).toBe(true);
    });

    it("curates an artifact for a param, then lists it", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      const result = await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });
      expect(result.ok).toBe(true);

      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);
    });

    it("re-sending the same paramCurations is idempotent", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });

      await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });
      const secondResult = await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });

      expect(secondResult.ok).toBe(true);
      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated).toHaveLength(1);
    });

    it("an empty paramCurations array removes all curations for that flow version", async () => {
      const { flowVersion } = await createFlowAndVersion();
      await repository.saveArtifact({
        hash: "a".repeat(64),
        time: "2026-06-30T00:00:00.000Z",
        format: "json",
      });
      await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });

      const result = await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: [],
      });
      expect(result.ok).toBe(true);

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
      await repository.updateMetadata("a".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });
      await repository.updateMetadata("b".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["otherParam"],
      });

      const curated = await repository.listCuratedArtifacts(
        flowVersion.id,
        "weatherApiKey",
      );
      expect(curated.map((artifact) => artifact.hash)).toEqual([
        "a".repeat(64),
      ]);
    });

    it("fails to curate a hash that was never saved as an artifact (FK constraint)", async () => {
      const { flowVersion } = await createFlowAndVersion();

      const result = await repository.updateMetadata("z".repeat(64), {
        flowVersionId: flowVersion.id,
        paramCurations: ["weatherApiKey"],
      });

      expect(result.ok).toBe(false);
    });
  });
});
