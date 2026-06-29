import Fastify from "fastify";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { FsArtifactIndexStore } from "@lcase/adapters/artifact-index-store";
import { FsArtifactStore } from "@lcase/adapters/artifact-store";
import { InMemoryEventBus } from "@lcase/adapters/event-bus";
import { FlowStoreFs } from "@lcase/adapters/flow-store";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { Artifacts } from "@lcase/artifacts";
import { PrismaClient } from "@lcase/db-prisma";
import { EmitterFactory } from "@lcase/events";
import { FlowService } from "@lcase/services";
import type { IndexStorePort } from "@lcase/ports";
import type { FlowDefinition, FlowIndex } from "@lcase/types";
import { postSqlFlowsRoute } from "../src/routes/flows/sql/post.js";

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

describe("sql flow routes", () => {
  let tmpDir: string;
  let artifactDir: string;
  let flowIndexDir: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-flow-sql-route-"));
    artifactDir = path.join(tmpDir, "artifacts");
    flowIndexDir = path.join(tmpDir, "flows", "index");

    const dbPath = path.join(tmpDir, "flow-route.sqlite");
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    prisma = new PrismaClient({ adapter });

    await applySqlFile(
      prisma,
      path.join(
        repoRoot,
        "packages/db-prisma/prisma/migrations/20260617124320_init/migration.sql",
      ),
    );
    await applySqlFile(
      prisma,
      path.join(
        repoRoot,
        "packages/db-prisma/prisma/migrations/20260627130000_flow_versions/migration.sql",
      ),
    );
  });

  afterEach(async () => {
    await prisma.$disconnect();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates a flow through the real sql application path", async () => {
    const artifactIndexStore = new FsArtifactIndexStore(artifactDir);
    await artifactIndexStore.init();

    const artifacts = new Artifacts(
      new FsArtifactStore(artifactDir),
      artifactIndexStore,
    );
    const bus = new InMemoryEventBus();
    const ef = new EmitterFactory(bus);
    const flowIndexStore: IndexStorePort<FlowIndex> = {
      async init() {},
      async put() {
        return { ok: true, value: path.join(flowIndexDir, "unused.index.json") };
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

    const flowService = new FlowService(
      bus,
      ef,
      new FlowStoreFs(),
      artifacts,
      flowIndexStore,
      new PrismaFlowRepository(prisma),
    );

    const app = Fastify();
    app.decorate("services", {
      flow: flowService,
    });

    await app.register(postSqlFlowsRoute);

    const flowDefinition: FlowDefinition = {
      name: "Prompt Flow",
      version: "v1",
      description: "Reusable flow",
      start: "fetch",
      steps: {
        fetch: {
          type: "httpjson",
          url: "https://example.com/api",
        },
      },
    };

    const response = await app.inject({
      method: "POST",
      url: "/",
      payload: flowDefinition,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      ok: true;
      value: {
        flow: {
          id: string;
          name: string;
          description?: string;
        };
        version: {
          id: string;
          flowId: string;
          sequence: number;
          definitionHash: string;
          versionLabel?: string;
        };
      };
    };

    expect(body.ok).toBe(true);
    expect(body.value.flow.name).toBe("Prompt Flow");
    expect(body.value.version.sequence).toBe(1);
    expect(body.value.version.definitionHash).toMatch(/^[a-f0-9]{64}$/);

    const storedFlows = await prisma.flow.findMany();
    const storedVersions = await prisma.flowVersion.findMany();
    expect(storedFlows).toHaveLength(1);
    expect(storedVersions).toHaveLength(1);
    expect(storedVersions[0]?.flowId).toBe(body.value.flow.id);
    expect(storedVersions[0]?.definitionHash).toBe(
      body.value.version.definitionHash,
    );

    const artifact = await artifacts.getJson(body.value.version.definitionHash);
    expect(artifact.ok).toBe(true);
    if (artifact.ok) {
      expect(artifact.value).toEqual(flowDefinition);
    }

    await app.close();
  });
});
