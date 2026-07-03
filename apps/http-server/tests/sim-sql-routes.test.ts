import Fastify from "fastify";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { InMemoryEventBus } from "@lcase/adapters/event-bus";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { PrismaSimRepository } from "@lcase/adapters/sim-repository";
import { FsArtifactStore } from "@lcase/adapters/artifact-store";
import { Artifacts } from "@lcase/artifacts";
import { PrismaClient } from "@lcase/db-prisma";
import { EmitterFactory } from "@lcase/events";
import type { RunQueryPort } from "@lcase/ports";
import type { IndexStorePort } from "@lcase/ports";
import { SimService } from "@lcase/services";
import type { RunIndex } from "@lcase/types";
import { getSimSpecRoute } from "../src/routes/sims/get-sim-spec.js";
import { simsListRoute } from "../src/routes/sims/list.js";
import { postSimsRoute } from "../src/routes/sims/post.js";

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

function makeRunIndexStore(): IndexStorePort<RunIndex> {
  return {
    async init() {},
    async put() {
      return { ok: false, error: "unused" };
    },
    async get() {
      return undefined;
    },
    async getIdList() {
      return [];
    },
    async getAll() {
      return [];
    },
  };
}

describe("sim sql routes", () => {
  let tmpDir: string;
  let artifactDir: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-sim-sql-route-"));
    artifactDir = path.join(tmpDir, "artifacts");

    const dbPath = path.join(tmpDir, "sim-route.sqlite");
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

  it("stores sim metadata in SQL while reading fork specs from CAS", async () => {
    const artifacts = new Artifacts(new FsArtifactStore(artifactDir));
    const flowRepository = new PrismaFlowRepository(prisma);
    const simRepository = new PrismaSimRepository(prisma);
    const flowResult = await flowRepository.createFlow({
      name: "Prompt Flow",
      description: "Reusable flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    const secondFlowResult = await flowRepository.createFlow({
      name: "Other Flow",
      definitionHash: "b".repeat(64),
      versionLabel: "v1",
    });
    expect(flowResult.ok).toBe(true);
    expect(secondFlowResult.ok).toBe(true);
    if (!flowResult.ok || !secondFlowResult.ok) return;

    const simService = new SimService(
      artifacts,
      new EmitterFactory(new InMemoryEventBus()),
      makeRunIndexStore(),
      {
        listRuns: async () => [],
        getRunDetail: async () => ({
          ok: false,
          error: "unused",
        }),
      } satisfies RunQueryPort,
      simRepository,
      flowRepository,
    );

    const app = Fastify();
    app.decorate("services", {
      sim: simService,
    });

    await app.register(simsListRoute, { prefix: "/api/sims" });
    await app.register(postSimsRoute, { prefix: "/api/sims" });
    await app.register(getSimSpecRoute, { prefix: "/api/sims" });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/sims",
      payload: {
        name: "Reuse Fetch",
        flowId: flowResult.value.flow.id,
        flowVersionId: flowResult.value.version.id,
        parentRunId: "run-test",
        reuse: ["fetch"],
      },
    });
    expect(createResponse.statusCode).toBe(200);
    const createBody = createResponse.json() as {
      ok: true;
      value: {
        id: string;
        flowId: string;
        flowVersionId: string;
        forkSpecHash: string;
      };
    };
    expect(createBody.ok).toBe(true);
    expect(createBody.value.flowId).toBe(flowResult.value.flow.id);
    expect(createBody.value.flowVersionId).toBe(flowResult.value.version.id);

    const simRows = await prisma.sim.findMany();
    expect(simRows).toHaveLength(1);
    expect(simRows[0]?.id).toBe(createBody.value.id);
    expect(simRows[0]?.forkSpecHash).toBe(createBody.value.forkSpecHash);

    const storedForkSpec = await artifacts.getJson(
      createBody.value.forkSpecHash,
    );
    expect(storedForkSpec).toEqual({
      ok: true,
      value: {
        parentRunId: "run-test",
        reuse: ["fetch"],
      },
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/sims",
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      ok: true,
      value: [
        {
          sim: expect.objectContaining({
            id: createBody.value.id,
            name: "Reuse Fetch",
            flowId: flowResult.value.flow.id,
            flowVersionId: flowResult.value.version.id,
            forkSpecHash: createBody.value.forkSpecHash,
          }),
          flow: expect.objectContaining({
            id: flowResult.value.flow.id,
            name: "Prompt Flow",
          }),
          flowVersion: expect.objectContaining({
            id: flowResult.value.version.id,
            versionLabel: "v1",
            definitionHash: "a".repeat(64),
          }),
        },
      ],
    });

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/sims/${createBody.value.id}`,
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toEqual({
      ok: true,
      value: {
        sim: expect.objectContaining({
          id: createBody.value.id,
          flowId: flowResult.value.flow.id,
          flowVersionId: flowResult.value.version.id,
          forkSpecHash: createBody.value.forkSpecHash,
        }),
        spec: {
          parentRunId: "run-test",
          reuse: ["fetch"],
        },
      },
    });

    const invalidResponse = await app.inject({
      method: "POST",
      url: "/api/sims",
      payload: {
        name: "Bad Sim",
        flowId: flowResult.value.flow.id,
        flowVersionId: secondFlowResult.value.version.id,
        parentRunId: "run-test",
        reuse: ["fetch"],
      },
    });
    expect(invalidResponse.statusCode).toBe(200);
    expect(invalidResponse.json()).toEqual({
      ok: false,
      error: "Flow version does not belong to the supplied flow",
    });

    await app.close();
  });
});
