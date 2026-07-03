import Fastify from "fastify";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { InMemoryEventBus } from "@lcase/adapters/event-bus";
import { PrismaRunQuery } from "@lcase/adapters/run-query";
import { PrismaClient } from "@lcase/db-prisma";
import { EmitterFactory } from "@lcase/events";
import type { ReplayServicePort } from "@lcase/ports";
import { RunService } from "@lcase/services";
import type { AnyEvent } from "@lcase/types";
import { getRunDetailRoute } from "../src/routes/runs/get-run-detail.js";
import { getRunsEventsListRoute } from "../src/routes/runs/events/events.js";
import { listRunsRoute } from "../src/routes/runs/list.js";

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

describe("run sql routes", () => {
  let tmpDir: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lcase-run-sql-route-"));
    const dbPath = path.join(tmpDir, "run-route.sqlite");
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

  it("serves run list, run detail, and replay events with SQL-backed reads", async () => {
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
        flowId: "flow-1",
        flowVersionId: "flow-version-1",
        flowDefHash: "a".repeat(64),
        forkSpecHash: "b".repeat(64),
        startTime: new Date("2026-07-02T10:00:01.000Z"),
        endTime: new Date("2026-07-02T10:00:04.000Z"),
        duration: 3,
      },
    });

    await prisma.runStepProjection.create({
      data: {
        runId: "run-1",
        stepId: "fetch",
        status: "completed",
        outputHash: "c".repeat(64),
      },
    });

    const runService = new RunService({
      ef: new EmitterFactory(new InMemoryEventBus()),
      runQuery: new PrismaRunQuery(prisma),
    });
    const replayEvents: AnyEvent[] = [
      {
        id: "event-1",
        type: "run.requested",
        action: "requested",
        time: "2026-07-02T10:00:00.000Z",
        source: "lowercase://test",
        specversion: "1.0",
        domain: "run",
        traceparent: "00-traceid-spanid-01",
        traceid: "traceid",
        spanid: "spanid",
        flowid: "a".repeat(64),
        runid: "run-1",
        data: {
          flowId: "flow-1",
          flowVersionId: "flow-version-1",
          flowDefHash: "a".repeat(64),
        },
      },
    ];
    const replayService = {
      async getAllEvents(runId: string) {
        expect(runId).toBe("run-1");
        return {
          events: replayEvents,
        };
      },
    } satisfies Pick<ReplayServicePort, "getAllEvents">;

    const app = Fastify();
    app.decorate("services", {
      run: runService,
      replay: replayService,
    });

    await app.register(listRunsRoute, { prefix: "/api/runs" });
    await app.register(getRunDetailRoute, { prefix: "/api/runs" });
    await app.register(getRunsEventsListRoute, { prefix: "/api/runs/details" });

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/runs",
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      ok: true,
      runList: [
        {
          runId: "run-1",
          flowName: "Prompt Flow",
          flowVersion: "v1",
          flowDefHash: "a".repeat(64),
          startTime: "2026-07-02T10:00:01.000Z",
          endTime: "2026-07-02T10:00:04.000Z",
          duration: 3,
          forkSpecHash: "b".repeat(64),
        },
      ],
    });

    const detailResponse = await app.inject({
      method: "GET",
      url: "/api/runs/run-1",
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json()).toEqual({
      ok: true,
      value: {
        run: expect.objectContaining({
          id: "run-1",
          flowDefHash: "a".repeat(64),
          status: "completed",
        }),
        steps: [
          {
            runId: "run-1",
            stepId: "fetch",
            status: "completed",
            outputHash: "c".repeat(64),
          },
        ],
        flow: expect.objectContaining({
          id: "flow-1",
          name: "Prompt Flow",
        }),
        flowVersion: expect.objectContaining({
          id: "flow-version-1",
          versionLabel: "v1",
        }),
      },
    });

    const eventsResponse = await app.inject({
      method: "GET",
      url: "/api/runs/details?runId=run-1",
    });
    expect(eventsResponse.statusCode).toBe(200);
    expect(eventsResponse.json()).toEqual({
      ok: true,
      events: replayEvents,
    });

    await app.close();
  });
});
