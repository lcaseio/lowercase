import type { PrismaClient } from "@lcase/db-prisma";
import type {
  Result,
  RunStepProjectionRecord,
  UpsertRunStepProjectionInput,
} from "@lcase/types";
import type { RunStepProjectionRepositoryPort } from "@lcase/ports";

type PrismaRunStepProjectionRepositoryDb = Pick<PrismaClient, "runStepProjection">;

function parseExportHashes(
  value: string | null,
): Record<string, string> | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, hash]) => typeof hash === "string"),
    ) as Record<string, string>;
  } catch {
    return undefined;
  }
}

function serializeExportHashes(
  value: Record<string, string> | undefined,
): string | undefined {
  if (!value || Object.keys(value).length === 0) return undefined;
  return JSON.stringify(value);
}

function toRunStepProjectionRecord(step: {
  runId: string;
  stepId: string;
  status: string | null;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  reusedTime: Date | null;
  wasReused: boolean | null;
  outputHash: string | null;
  argsHash: string | null;
  exportHashes: string | null;
}): RunStepProjectionRecord {
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
    argsHash: step.argsHash ?? undefined,
    exportHashes: parseExportHashes(step.exportHashes),
  };
}

function toOptionalDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function definedFields<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export class PrismaRunStepProjectionRepository
  implements RunStepProjectionRepositoryPort
{
  constructor(private readonly db: PrismaRunStepProjectionRepositoryDb) {}

  async upsertStepProjection(
    input: UpsertRunStepProjectionInput,
  ): Promise<Result<RunStepProjectionRecord, string>> {
    try {
      const saved = await this.db.runStepProjection.upsert({
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
          argsHash: input.argsHash,
          exportHashes: serializeExportHashes(input.exportHashes),
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
          argsHash: input.argsHash,
          exportHashes: serializeExportHashes(input.exportHashes),
        },
      });

      return { ok: true, value: toRunStepProjectionRecord(saved) };
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
      return { ok: true, value: toRunStepProjectionRecord(step) };
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
    return steps.map(toRunStepProjectionRecord);
  }
}
