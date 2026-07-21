import Fastify from "fastify";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaArtifactRepository } from "@lcase/adapters/artifact-repository";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { FsArtifactStore } from "@lcase/adapters/artifact-store";
import { Artifacts } from "@lcase/artifacts";
import { PrismaClient } from "@lcase/db-prisma";
import { ArtifactService } from "@lcase/services";
import type { FlowDefinition, JsonValue } from "@lcase/types";
import {
  getCuratedArtifactsForParamRoute,
  postCurateArtifactForParamRoute,
  deleteUncurateArtifactForParamRoute,
} from "../src/routes/flows/curated-artifacts.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");

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

describe("curated-artifacts routes", () => {
  let tmpDir: string;
  let artifactDir: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "lcase-curated-artifacts-route-"),
    );
    artifactDir = path.join(tmpDir, "artifacts");

    const dbPath = path.join(tmpDir, "curated-artifacts-route.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applyMigrations(
      prisma,
      path.join(repoRoot, "packages/db-prisma/prisma/migrations"),
    );
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function setUp() {
    const artifactRepository = new PrismaArtifactRepository(prisma);
    const flowRepository = new PrismaFlowRepository(prisma);
    const artifacts = new Artifacts(
      new FsArtifactStore(artifactDir),
      artifactRepository,
    );
    const artifactService = new ArtifactService(
      artifacts,
      artifactRepository,
      flowRepository,
    );

    const app = Fastify();
    app.decorate("services", { artifact: artifactService });
    await app.register(getCuratedArtifactsForParamRoute, {
      prefix: "/api/flows",
    });
    await app.register(postCurateArtifactForParamRoute, {
      prefix: "/api/flows",
    });
    await app.register(deleteUncurateArtifactForParamRoute, {
      prefix: "/api/flows",
    });

    const definition: FlowDefinition = {
      name: "Weather Flow",
      version: "v1",
      params: {
        weatherApiKey: { type: "text/plain" },
      },
      start: "fetch",
      steps: {
        fetch: { type: "httpjson", url: "https://example.com" },
      },
    };
    const defResult = await artifacts.putJson(definition as JsonValue);
    if (!defResult.ok) throw new Error("failed to store flow definition");

    const flow = await prisma.flow.create({ data: { name: "Weather Flow" } });
    const flowVersion = await prisma.flowVersion.create({
      data: {
        flowId: flow.id,
        sequence: 1,
        definitionHash: defResult.value,
      },
    });

    await artifactRepository.saveArtifact({
      hash: "a".repeat(64),
      time: "2026-01-01T00:00:00.000Z",
      format: "text",
    });

    return { app, artifactRepository, flow, flowVersion };
  }

  it("curates an artifact for a declared param, then lists it", async () => {
    const { app, flowVersion } = await setUp();

    const postResponse = await app.inject({
      method: "POST",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
      payload: { artifactHash: "a".repeat(64) },
    });
    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.json()).toEqual({
      ok: true,
      value: expect.objectContaining({
        hash: "a".repeat(64),
        flowVersionId: flowVersion.id,
        curated: true,
      }),
    });

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
    });
    expect(getResponse.json()).toEqual({
      ok: true,
      value: [expect.objectContaining({ hash: "a".repeat(64) })],
    });

    await app.close();
  });

  it("rejects curating for a param that isn't declared on the flow version's definition", async () => {
    const { app, flowVersion } = await setUp();

    const postResponse = await app.inject({
      method: "POST",
      url: `/api/flows/versions/${flowVersion.id}/params/undeclaredParam/curated-artifacts`,
      payload: { artifactHash: "a".repeat(64) },
    });
    expect(postResponse.json()).toEqual({
      ok: false,
      error: expect.stringContaining("Undeclared param"),
    });

    await app.close();
  });

  it("crossVersion: true also sets flowId; omitted leaves it unset", async () => {
    const { app, flow, flowVersion } = await setUp();

    const withoutCrossVersion = await app.inject({
      method: "POST",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
      payload: { artifactHash: "a".repeat(64) },
    });
    const withoutCrossVersionBody = withoutCrossVersion.json() as {
      value: { flowId?: string };
    };
    expect(withoutCrossVersionBody.value.flowId).toBeUndefined();

    const withCrossVersion = await app.inject({
      method: "POST",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
      payload: { artifactHash: "a".repeat(64), crossVersion: true },
    });
    expect(withCrossVersion.json()).toEqual({
      ok: true,
      value: expect.objectContaining({
        flowId: flow.id,
        flowVersionId: flowVersion.id,
      }),
    });

    await app.close();
  });

  it("uncurates an artifact, removing it from the list", async () => {
    const { app, flowVersion } = await setUp();

    await app.inject({
      method: "POST",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
      payload: { artifactHash: "a".repeat(64) },
    });

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts/${"a".repeat(64)}`,
    });
    expect(deleteResponse.json()).toEqual({ ok: true, value: undefined });

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
    });
    expect(getResponse.json()).toEqual({ ok: true, value: [] });

    await app.close();
  });
});
