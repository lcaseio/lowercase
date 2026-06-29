import { describe, expect, it } from "vitest";
import { PrismaFlowRepository } from "../../src/flow-repository/prisma-flow-repository.js";

type FlowRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type FlowVersionRow = {
  id: string;
  flowId: string;
  sequence: number;
  definitionHash: string;
  versionLabel: string | null;
  description: string | null;
  createdAt: Date;
};

function makeFakeDb() {
  const flows: FlowRow[] = [];
  const versions: FlowVersionRow[] = [];
  let flowCounter = 0;
  let versionCounter = 0;

  return {
    flow: {
      async create(args: {
        data: {
          name: string;
          description?: string;
          versions: {
            create: {
              sequence: number;
              definitionHash: string;
              versionLabel?: string;
              description?: string;
            };
          };
        };
        include: {
          versions: {
            orderBy: { sequence: "asc" | "desc" };
            take: number;
          };
        };
      }) {
        const now = new Date(Date.UTC(2026, 5, 27, 0, 0, flowCounter));
        const flow: FlowRow = {
          id: `flow_${++flowCounter}`,
          name: args.data.name,
          description: args.data.description ?? null,
          createdAt: now,
          updatedAt: now,
        };
        const version: FlowVersionRow = {
          id: `version_${++versionCounter}`,
          flowId: flow.id,
          sequence: args.data.versions.create.sequence,
          definitionHash: args.data.versions.create.definitionHash,
          versionLabel: args.data.versions.create.versionLabel ?? null,
          description: args.data.versions.create.description ?? null,
          createdAt: now,
        };
        flows.push(flow);
        versions.push(version);
        return {
          ...flow,
          versions: [version],
        };
      },
      async findUnique(args: { where: { id: string } }) {
        return flows.find((flow) => flow.id === args.where.id) ?? null;
      },
      async findMany(args: { orderBy: { createdAt: "asc" | "desc" } }) {
        return [...flows].sort((left, right) =>
          args.orderBy.createdAt === "desc"
            ? right.createdAt.getTime() - left.createdAt.getTime()
            : left.createdAt.getTime() - right.createdAt.getTime(),
        );
      },
    },
    flowVersion: {
      async findMany(args: {
        where: { flowId: string };
        orderBy: { sequence: "asc" | "desc" };
      }) {
        return versions
          .filter((version) => version.flowId === args.where.flowId)
          .sort((left, right) =>
            args.orderBy.sequence === "asc"
              ? left.sequence - right.sequence
              : right.sequence - left.sequence,
          );
      },
      async findUnique(args: {
        where: { id: string };
        select?: { definitionHash: true };
      }) {
        const version =
          versions.find((item) => item.id === args.where.id) ?? null;
        if (!version || !args.select) return version;
        return { definitionHash: version.definitionHash };
      },
      async create(args: {
        data: {
          flowId: string;
          sequence: number;
          definitionHash: string;
          versionLabel?: string;
        };
      }) {
        const version: FlowVersionRow = {
          id: `version_${++versionCounter}`,
          flowId: args.data.flowId,
          sequence: args.data.sequence,
          definitionHash: args.data.definitionHash,
          versionLabel: args.data.versionLabel ?? null,
          description: null,
          createdAt: new Date(Date.UTC(2026, 5, 27, 0, 0, versionCounter)),
        };
        versions.push(version);
        return version;
      },
    },
  };
}

describe("PrismaFlowRepository", () => {
  it("creates a stable flow with its first version", async () => {
    const repository = new PrismaFlowRepository(makeFakeDb() as never);

    const result = await repository.createFlow({
      name: "Prompt Flow",
      description: "Reusable prompt flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
      versionDescription: "Initial version",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.flow.name).toBe("Prompt Flow");
    expect(result.value.flow.description).toBe("Reusable prompt flow");
    expect(result.value.version.sequence).toBe(1);
    expect(result.value.version.definitionHash).toBe("a".repeat(64));
    expect(result.value.version.versionLabel).toBe("v1");
    expect(result.value.version.flowId).toBe(result.value.flow.id);
  });

  it("lists flows newest first", async () => {
    const repository = new PrismaFlowRepository(makeFakeDb() as never);

    const first = await repository.createFlow({
      name: "First Flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    const second = await repository.createFlow({
      name: "Second Flow",
      definitionHash: "b".repeat(64),
      versionLabel: "v1",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const flows = await repository.listFlows();
    expect(flows.map((flow) => flow.name)).toEqual(["Second Flow", "First Flow"]);
  });

  it("lists versions ordered by sequence", async () => {
    const db = makeFakeDb();
    const repository = new PrismaFlowRepository(db as never);

    const created = await repository.createFlow({
      name: "Versioned Flow",
      definitionHash: "a".repeat(64),
      versionLabel: "v1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await db.flowVersion.create({
      data: {
        flowId: created.value.flow.id,
        sequence: 2,
        definitionHash: "b".repeat(64),
        versionLabel: "v2",
      },
    });

    const versions = await repository.listFlowVersions(created.value.flow.id);
    expect(versions.map((version) => version.sequence)).toEqual([1, 2]);
    expect(versions.map((version) => version.definitionHash)).toEqual([
      "a".repeat(64),
      "b".repeat(64),
    ]);
  });

  it("resolves a version to its definition hash", async () => {
    const repository = new PrismaFlowRepository(makeFakeDb() as never);

    const created = await repository.createFlow({
      name: "Hash Flow",
      definitionHash: "c".repeat(64),
      versionLabel: "v1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const hash = await repository.getFlowVersionDefinitionHash(
      created.value.version.id,
    );
    expect(hash).toEqual({ ok: true, value: "c".repeat(64) });
  });
});
