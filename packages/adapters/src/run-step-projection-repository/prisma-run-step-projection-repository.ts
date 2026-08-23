import type { PrismaClient } from "@lcase/db-prisma";
import type {
  Result,
  RunStepExportRecord,
  RunStepProjectionRecord,
  UpsertRunStepProjectionInput,
} from "@lcase/types";
import type { RunStepProjectionRepositoryPort } from "@lcase/ports";

type PrismaRunStepProjectionRepositoryDb = Pick<
  PrismaClient,
  "runStepProjection" | "runStepExport" | "$transaction"
>;

function toRunStepProjectionRecord(
  step: {
    runId: string;
    stepId: string;
    status: string | null;
    startTime: Date | null;
    endTime: Date | null;
    duration: number | null;
    reusedTime: Date | null;
    wasReused: boolean | null;
    outputHash: string | null;
  },
  exports: RunStepExportRecord[],
): RunStepProjectionRecord {
  return {
    runId: step.runId,
    stepId: step.stepId,
    status: step.status ?? undefined,
    startTime: step.startTime?.toISOString(),
    endTime: step.endTime?.toISOString(),
    duration: step.duration ?? undefined,
    reusedTime: step.reusedTime?.toISOString(),
    wasReused: step.wasReused ?? undefined,
    outputHash: step.outputHash ?? undefined,
    exports: exports.length > 0 ? exports : undefined,
  };
}

function toRunStepExportRecord(row: {
  name: string;
  artifactHash: string;
}): RunStepExportRecord {
  return { name: row.name, artifactHash: row.artifactHash };
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

export class PrismaRunStepProjectionRepository implements RunStepProjectionRepositoryPort {
  constructor(private readonly db: PrismaRunStepProjectionRepositoryDb) {}

  async upsertStepProjection(
    input: UpsertRunStepProjectionInput,
  ): Promise<Result<RunStepProjectionRecord, string>> {
    try {
      const saved = await this.db.$transaction(async (tx) => {
        const step = await tx.runStepProjection.upsert({
          where: {
            runId_stepId: {
              runId: input.runId,
              stepId: input.stepId,
            },
          },
          update: definedFields({
            status: input.status,
            startTime: toOptionalDate(input.startTime),
            endTime: toOptionalDate(input.endTime),
            duration: input.duration,
            reusedTime: toOptionalDate(input.reusedTime),
            wasReused: input.wasReused,
            outputHash: input.outputHash,
          }),
          create: {
            runId: input.runId,
            stepId: input.stepId,
            status: input.status,
            startTime: toOptionalDate(input.startTime),
            endTime: toOptionalDate(input.endTime),
            duration: input.duration,
            reusedTime: toOptionalDate(input.reusedTime),
            wasReused: input.wasReused,
            outputHash: input.outputHash,
          },
        });

        if (input.exportHashes !== undefined) {
          await tx.runStepExport.deleteMany({
            where: { runId: input.runId, stepId: input.stepId },
          });
          const entries = Object.entries(input.exportHashes);
          if (entries.length > 0) {
            await tx.runStepExport.createMany({
              data: entries.map(([name, artifactHash]) => ({
                runId: input.runId,
                stepId: input.stepId,
                name,
                artifactHash,
              })),
            });
          }
        }

        const exports = await tx.runStepExport.findMany({
          where: { runId: input.runId, stepId: input.stepId },
        });

        return { step, exports };
      });

      return {
        ok: true,
        value: toRunStepProjectionRecord(
          saved.step,
          saved.exports.map(toRunStepExportRecord),
        ),
      };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to upsert step projection: ${String(error)}`,
      };
    }
  }

  async getStepProjection(
    runId: string,
    stepId: string,
  ): Promise<Result<RunStepProjectionRecord, string>> {
    try {
      const step = await this.db.runStepProjection.findUnique({
        where: { runId_stepId: { runId, stepId } },
      });
      if (!step) {
        return {
          ok: false,
          error: `Run step projection not found: ${runId}/${stepId}`,
        };
      }
      const exports = await this.db.runStepExport.findMany({
        where: { runId, stepId },
      });
      return {
        ok: true,
        value: toRunStepProjectionRecord(
          step,
          exports.map(toRunStepExportRecord),
        ),
      };
    } catch (error) {
      return {
        ok: false,
        error: `Unable to read step projection: ${String(error)}`,
      };
    }
  }

  async listStepProjections(runId: string): Promise<RunStepProjectionRecord[]> {
    const steps = await this.db.runStepProjection.findMany({
      where: { runId },
      orderBy: [{ stepId: "asc" }],
    });
    const exports = await this.db.runStepExport.findMany({ where: { runId } });
    const exportsByStepId = new Map<string, RunStepExportRecord[]>();
    for (const exportRow of exports) {
      const list = exportsByStepId.get(exportRow.stepId) ?? [];
      list.push(toRunStepExportRecord(exportRow));
      exportsByStepId.set(exportRow.stepId, list);
    }
    return steps.map((step) =>
      toRunStepProjectionRecord(step, exportsByStepId.get(step.stepId) ?? []),
    );
  }
}
