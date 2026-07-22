import Fastify from "fastify";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaArtifactRepository } from "@lcase/adapters/artifact-repository";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { FsArtifactStore } from "@lcase/adapters/artifact-store";
import { Artifacts } from "@lcase/artifacts";
import { PrismaClient } from "@lcase/db-prisma";
import { ArtifactService } from "@lcase/services";
import { getArtifactRoute } from "../src/routes/artifacts/get-artifact.js";
import { listArtifactsRoute } from "../src/routes/artifacts/list-artifacts.js";
import { postArtifactFileRoute } from "../src/routes/artifacts/post-artifact-file.js";
import { putJsonArtifactRoute } from "../src/routes/artifacts/put-json-artifact.js";
import { patchArtifactRoute } from "../src/routes/artifacts/associate-artifact.js";
import { postCurateArtifactForParamRoute } from "../src/routes/flows/curated-artifacts.js";
import type { FlowDefinition } from "@lcase/types";

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

describe("artifact sql routes", () => {
  let tmpDir: string;
  let artifactDir: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "lcase-artifact-sql-route-"),
    );
    artifactDir = path.join(tmpDir, "artifacts");

    const dbPath = path.join(tmpDir, "artifact-route.sqlite");
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

  it("stores artifact metadata in SQL while reading content from CAS", async () => {
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
    await app.register(import("@fastify/multipart"));
    app.decorate("services", {
      artifact: artifactService,
    });

    await app.register(listArtifactsRoute, { prefix: "/api/artifacts" });
    await app.register(getArtifactRoute, { prefix: "/api/artifacts" });
    await app.register(putJsonArtifactRoute, { prefix: "/api/artifacts" });
    await app.register(postArtifactFileRoute, {
      prefix: "/api/artifacts/files",
    });
    await app.register(patchArtifactRoute, { prefix: "/api/artifacts" });

    const jsonResponse = await app.inject({
      method: "POST",
      url: "/api/artifacts/json",
      payload: {
        value: { hello: "world" },
        label: "Prompt",
      },
    });
    expect(jsonResponse.statusCode).toBe(200);
    const jsonBody = jsonResponse.json() as { ok: true; value: string };
    expect(jsonBody.ok).toBe(true);

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/artifacts",
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual({
      ok: true,
      value: [
        expect.objectContaining({
          artifact: expect.objectContaining({
            hash: jsonBody.value,
            label: "Prompt",
            contentType: "application/json",
            format: "json",
          }),
          associations: expect.objectContaining({
            curated: false,
            paramCurations: [],
          }),
        }),
      ],
    });

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/artifacts/${jsonBody.value}`,
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toEqual({
      ok: true,
      format: "json",
      value: { hello: "world" },
    });

    const fileResponse = await app.inject({
      method: "POST",
      url: "/api/artifacts/files",
      payload: makeMultipartBody("# prompt", "prompt.md", "text/markdown", {
        label: "Markdown Prompt",
      }),
      headers: makeMultipartHeaders(),
    });
    expect(fileResponse.statusCode).toBe(200);
    const fileBody = fileResponse.json() as { ok: true; value: string };
    expect(fileBody.ok).toBe(true);

    const storedMetadata = await prisma.artifact.findMany({
      orderBy: [{ time: "desc" }, { hash: "desc" }],
    });
    expect(storedMetadata).toHaveLength(2);
    expect(
      storedMetadata.some((artifact) => artifact.hash === jsonBody.value),
    ).toBe(true);
    expect(
      storedMetadata.some(
        (artifact) =>
          artifact.hash === fileBody.value &&
          artifact.label === "Markdown Prompt" &&
          artifact.filename === "prompt.md" &&
          artifact.contentType === "text/markdown" &&
          artifact.format === "markdown",
      ),
    ).toBe(true);

    const markdown = await artifacts.getMarkdown(fileBody.value);
    expect(markdown).toEqual({ ok: true, value: "# prompt" });

    await app.close();
  });

  it("PATCH /api/artifacts/:hash associates and toggles curated", async () => {
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
    await app.register(putJsonArtifactRoute, { prefix: "/api/artifacts" });
    await app.register(patchArtifactRoute, { prefix: "/api/artifacts" });

    const putResponse = await app.inject({
      method: "POST",
      url: "/api/artifacts/json",
      payload: { value: { hello: "world" } },
    });
    const hash = (putResponse.json() as { value: string }).value;

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/api/artifacts/${hash}`,
      payload: { curated: true },
    });
    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json()).toEqual({
      ok: true,
      value: expect.objectContaining({ hash, curated: true }),
    });

    const invalidHashResponse = await app.inject({
      method: "PATCH",
      url: "/api/artifacts/not-a-hash",
      payload: { curated: true },
    });
    expect(invalidHashResponse.json()).toEqual({
      ok: false,
      error: "Invalid hash",
    });

    await app.close();
  });

  it("GET /api/artifacts filters by flowId, flowVersionId, and curated", async () => {
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
    await app.register(listArtifactsRoute, { prefix: "/api/artifacts" });

    const flow = await prisma.flow.create({ data: { name: "Test Flow" } });
    const flowVersion = await prisma.flowVersion.create({
      data: { flowId: flow.id, sequence: 1, definitionHash: "h".repeat(64) },
    });

    const curatedResult = await artifactRepository.saveArtifact({
      hash: "a".repeat(64),
      time: "2026-01-01T00:00:00.000Z",
      format: "json",
    });
    expect(curatedResult.ok).toBe(true);
    await artifactRepository.associateArtifact("a".repeat(64), {
      flowId: flow.id,
      flowVersionId: flowVersion.id,
      curated: true,
    });
    await artifactRepository.saveArtifact({
      hash: "b".repeat(64),
      time: "2026-01-02T00:00:00.000Z",
      format: "json",
    });

    const curatedOnly = await app.inject({
      method: "GET",
      url: "/api/artifacts?curated=true",
    });
    expect(curatedOnly.json()).toEqual({
      ok: true,
      value: [
        expect.objectContaining({
          artifact: expect.objectContaining({ hash: "a".repeat(64) }),
        }),
      ],
    });

    const byFlowVersion = await app.inject({
      method: "GET",
      url: `/api/artifacts?flowVersionId=${flowVersion.id}`,
    });
    expect(byFlowVersion.json()).toEqual({
      ok: true,
      value: [
        expect.objectContaining({
          artifact: expect.objectContaining({ hash: "a".repeat(64) }),
        }),
      ],
    });

    const unfiltered = await app.inject({
      method: "GET",
      url: "/api/artifacts",
    });
    expect((unfiltered.json() as { value: unknown[] }).value).toHaveLength(2);

    await app.close();
  });

  it("GET /api/artifacts includes paramCurations when scoped by flowVersionId", async () => {
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
    await app.register(listArtifactsRoute, { prefix: "/api/artifacts" });
    await app.register(postCurateArtifactForParamRoute, {
      prefix: "/api/flows",
    });

    const definition: FlowDefinition = {
      name: "Weather Flow",
      version: "v1",
      params: { weatherApiKey: { type: "text/plain" } },
      start: "fetch",
      steps: { fetch: { type: "httpjson", url: "https://example.com" } },
    };
    const defResult = await artifacts.putJson(definition);
    if (!defResult.ok) throw new Error("failed to store flow definition");

    const flow = await prisma.flow.create({ data: { name: "Weather Flow" } });
    const flowVersion = await prisma.flowVersion.create({
      data: { flowId: flow.id, sequence: 1, definitionHash: defResult.value },
    });

    await artifactRepository.saveArtifact({
      hash: "a".repeat(64),
      time: "2026-01-01T00:00:00.000Z",
      format: "text",
    });

    const curateResponse = await app.inject({
      method: "POST",
      url: `/api/flows/versions/${flowVersion.id}/params/weatherApiKey/curated-artifacts`,
      payload: { artifactHash: "a".repeat(64) },
    });
    expect(curateResponse.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: "GET",
      url: `/api/artifacts?flowVersionId=${flowVersion.id}`,
    });
    expect(listResponse.json()).toEqual({
      ok: true,
      value: [
        expect.objectContaining({
          artifact: expect.objectContaining({ hash: "a".repeat(64) }),
          associations: expect.objectContaining({
            paramCurations: [
              { flowVersionId: flowVersion.id, paramName: "weatherApiKey" },
            ],
          }),
        }),
      ],
    });

    await app.close();
  });
});

const multipartBoundary = `----lcase-${randomUUID()}`;

function makeMultipartHeaders() {
  return {
    "content-type": `multipart/form-data; boundary=${multipartBoundary}`,
  };
}

function makeMultipartBody(
  content: string,
  filename: string,
  contentType: string,
  fields: Record<string, string> = {},
) {
  return [
    `--${multipartBoundary}`,
    ...Object.entries(fields).flatMap(([name, value]) => [
      `Content-Disposition: form-data; name="${name}"`,
      "",
      value,
      `--${multipartBoundary}`,
    ]),
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    "",
    content,
    `--${multipartBoundary}--`,
    "",
  ].join("\r\n");
}
