import type { PrismaClient } from "@lcase/db-prisma";
import type {
  CreateRunRecordInput,
  Result,
  RunRecord,
  RunStatus,
  UpdateRunRecordInput,
} from "@lcase/types";
import type { RunRepositoryPort } from "@lcase/ports";

type PrismaRunRepositoryDb = Pick<
  PrismaClient,
  "run" | "runParam" | "$transaction"
>;

function toRunStatus(status: string): RunStatus {
  switch (status) {
    case "requested":
    case "started":
    case "completed":
    case "failed":
      return status;
    default:
      throw new Error(`Unknown run status: ${status}`);
  }
}

function toRunRecord(run: {
  id: string;
  traceId: string;
  status: string;
  source: string;
  flowId: string | null;
  flowVersionId: string | null;
  flowDefHash: string;
  simId: string | null;
  parentRunId: string | null;
  forkSpecHash: string | null;
  experimentId: string | null;
  targetRunId: string | null;
  targetStepId: string | null;
  targetExportName: string | null;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}): RunRecord {
  return {
    id: run.id,
    traceId: run.traceId,
    status: toRunStatus(run.status),
    source: run.source,
    flowId: run.flowId ?? undefined,
    flowVersionId: run.flowVersionId ?? undefined,
    flowDefHash: run.flowDefHash,
    simId: run.simId ?? undefined,
    parentRunId: run.parentRunId ?? undefined,
    forkSpecHash: run.forkSpecHash ?? undefined,
    experimentId: run.experimentId ?? undefined,
    targetRunId: run.targetRunId ?? undefined,
    targetStepId: run.targetStepId ?? undefined,
    targetExportName: run.targetExportName ?? undefined,
    startTime: run.startTime?.toISOString(),
    endTime: run.endTime?.toISOString(),
    duration: run.duration ?? undefined,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}

function toOptionalDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function definedFields<T extends Record<string, unknown>>(
  input: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export class PrismaRunRepository implements RunRepositoryPort {
  constructor(private readonly db: PrismaRunRepositoryDb) {}

  async createRun(
    input: CreateRunRecordInput,
  ): Promise<Result<RunRecord, string>> {
    try {
      const created = await this.db.$transaction(async (tx) => {
        const run = await tx.run.upsert({
          where: { id: input.id },
          update: definedFields({
            traceId: input.traceId,
            status: input.status,
            source: input.source,
            flowId: input.flowId,
            flowVersionId: input.flowVersionId,
            flowDefHash: input.flowDefHash,
            simId: input.simId,
            parentRunId: input.parentRunId,
            forkSpecHash: input.forkSpecHash,
            experimentId: input.experimentId,
            targetRunId: input.targetRunId,
            targetStepId: input.targetStepId,
            targetExportName: input.targetExportName,
            startTime: toOptionalDate(input.startTime),
            endTime: toOptionalDate(input.endTime),
            duration: input.duration,
          }),
          create: {
            id: input.id,
            traceId: input.traceId,
            status: input.status,
            source: input.source,
            flowId: input.flowId,
            flowVersionId: input.flowVersionId,
            flowDefHash: input.flowDefHash,
            simId: input.simId,
            parentRunId: input.parentRunId,
            forkSpecHash: input.forkSpecHash,
            experimentId: input.experimentId,
            targetRunId: input.targetRunId,
            targetStepId: input.targetStepId,
            targetExportName: input.targetExportName,
            startTime: toOptionalDate(input.startTime),
            endTime: toOptionalDate(input.endTime),
            duration: input.duration,
          },
        });

        if (input.params !== undefined) {
          await tx.runParam.deleteMany({ where: { runId: input.id } });
          const entries = Object.entries(input.params);
          if (entries.length > 0) {
            await tx.runParam.createMany({
              data: entries.map(([name, artifactHash]) => ({
                runId: input.id,
                name,
                artifactHash,
              })),
            });
          }
        }

        return run;
      });

      return { ok: true, value: toRunRecord(created) };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to create run record: ${String(error)}`,
      };
    }
  }

  async updateRun(
    input: UpdateRunRecordInput,
  ): Promise<Result<RunRecord, string>> {
    try {
      const updated = await this.db.run.update({
        where: { id: input.id },
        data: definedFields({
          status: input.status,
          source: input.source,
          flowId: input.flowId,
          flowVersionId: input.flowVersionId,
          flowDefHash: input.flowDefHash,
          simId: input.simId,
          parentRunId: input.parentRunId,
          forkSpecHash: input.forkSpecHash,
          experimentId: input.experimentId,
          targetRunId: input.targetRunId,
          targetStepId: input.targetStepId,
          targetExportName: input.targetExportName,
          startTime: toOptionalDate(input.startTime),
          endTime: toOptionalDate(input.endTime),
          duration: input.duration,
        }),
      });

      return { ok: true, value: toRunRecord(updated) };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to update run record: ${String(error)}`,
      };
    }
  }

  async getRun(runId: string): Promise<Result<RunRecord, string>> {
    try {
      const run = await this.db.run.findUnique({ where: { id: runId } });
      if (!run) return { ok: false, error: `Run not found: ${runId}` };
      return { ok: true, value: toRunRecord(run) };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to read run record: ${String(error)}`,
      };
    }
  }

  async listRuns(): Promise<RunRecord[]> {
    const runs = await this.db.run.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return runs.map(toRunRecord);
  }
}
