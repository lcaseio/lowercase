import { resolveJsonPath } from "@lcase/json-ref-binder";
import type { ArtifactsPort, PutError } from "@lcase/ports";
import type { ExportRef, JsonValue, Result } from "@lcase/types";
import { validateExportSchema } from "../export-validation.js";
import type { StoredExecutionOutputs } from "./job-result.factories.js";
import type {
  ArtifactRef,
  JobExecutionError,
  JobExecutionErrorCode,
} from "./job.contracts.js";

export type StoreExecutionOutputsOutcome =
  | { ok: true; outputs: StoredExecutionOutputs }
  | { ok: false; error: JobExecutionError; output?: ArtifactRef };

type StoreExportsOutcome =
  | { ok: true; exports?: Record<string, ArtifactRef> }
  | { ok: false; error: JobExecutionError };

type StoreExportOutcome =
  { ok: true; artifact: ArtifactRef } | { ok: false; error: JobExecutionError };

type JsonExportValueOutcome =
  { ok: true; value: JsonValue } | { ok: false; error: JobExecutionError };

type ExportErrorCode = Extract<
  JobExecutionErrorCode,
  | "EXPORT_RESOLUTION_FAILED"
  | "EXPORT_VALIDATION_FAILED"
  | "EXPORT_STORE_FAILED"
>;

export async function tryStoreOutput(
  artifacts: ArtifactsPort,
  payload: JsonValue,
): Promise<ArtifactRef | undefined> {
  const result = await artifacts.putJson(payload);
  return result.ok ? { hash: result.value } : undefined;
}

export async function storeExecutionOutputs(
  artifacts: ArtifactsPort,
  payload: JsonValue,
  declarations?: Record<string, ExportRef>,
): Promise<StoreExecutionOutputsOutcome> {
  const outputResult = await artifacts.putJson(payload);
  if (!outputResult.ok) {
    return {
      ok: false,
      error: {
        code: "OUTPUT_STORE_FAILED",
        message: outputResult.error.message,
        retryable: false,
      },
    };
  }

  const output: ArtifactRef = { hash: outputResult.value };
  const storedExports = await storeDeclaredExports(
    artifacts,
    payload,
    declarations,
  );
  if (!storedExports.ok) {
    return { ok: false, error: storedExports.error, output };
  }

  return {
    ok: true,
    outputs: {
      output,
      ...(storedExports.exports ? { exports: storedExports.exports } : {}),
    },
  };
}

async function storeDeclaredExports(
  artifacts: ArtifactsPort,
  payload: JsonValue,
  declarations?: Record<string, ExportRef>,
): Promise<StoreExportsOutcome> {
  const entries = Object.entries(declarations ?? {});
  if (entries.length === 0) return { ok: true };

  const exports: Record<string, ArtifactRef> = {};
  for (const [exportName, declaration] of entries) {
    const stored = await storeDeclaredExport(
      artifacts,
      payload,
      exportName,
      declaration,
    );
    if (!stored.ok) return stored;
    exports[exportName] = stored.artifact;
  }

  return { ok: true, exports };
}

async function storeDeclaredExport(
  artifacts: ArtifactsPort,
  payload: JsonValue,
  exportName: string,
  declaration: ExportRef,
): Promise<StoreExportOutcome> {
  // Export paths carry a leading "output" segment by construction. The
  // payload passed here is already the output itself.
  const selected = resolveJsonPath(declaration.valuePath.slice(1), payload);
  if (selected === undefined) {
    return exportFailure(
      "EXPORT_RESOLUTION_FAILED",
      `Could not resolve export "${exportName}" from "${declaration.string}"`,
    );
  }

  if (declaration.type === "application/json") {
    return storeJsonExport(artifacts, exportName, declaration, selected);
  }

  return storeTextExport(artifacts, exportName, declaration.type, selected);
}

async function storeJsonExport(
  artifacts: ArtifactsPort,
  exportName: string,
  declaration: ExportRef,
  selected: unknown,
): Promise<StoreExportOutcome> {
  const valueResult = jsonExportValue(exportName, selected);
  if (!valueResult.ok) return valueResult;

  if (declaration.schema) {
    const validation = validateExportSchema(
      declaration.schema,
      valueResult.value,
    );
    if (!validation.ok) {
      return exportFailure(
        "EXPORT_VALIDATION_FAILED",
        `Export "${exportName}" failed schema validation: ${validation.message}`,
      );
    }
  }

  return storedArtifact(await artifacts.putJson(valueResult.value));
}

function jsonExportValue(
  exportName: string,
  selected: unknown,
): JsonExportValueOutcome {
  if (typeof selected !== "string") {
    return { ok: true, value: selected as JsonValue };
  }

  try {
    return { ok: true, value: JSON.parse(selected) as JsonValue };
  } catch (err) {
    return exportFailure(
      "EXPORT_RESOLUTION_FAILED",
      `Export "${exportName}" could not be parsed as JSON: ${String(err)}`,
    );
  }
}

async function storeTextExport(
  artifacts: ArtifactsPort,
  exportName: string,
  type: "text/plain" | "text/markdown",
  selected: unknown,
): Promise<StoreExportOutcome> {
  if (typeof selected !== "string") {
    return exportFailure(
      "EXPORT_RESOLUTION_FAILED",
      `Export "${exportName}" declared ${type} but resolved value is not a string`,
    );
  }

  const result =
    type === "text/plain"
      ? await artifacts.putText(selected)
      : await artifacts.putMarkdown(selected);
  return storedArtifact(result);
}

function storedArtifact(result: Result<string, PutError>): StoreExportOutcome {
  if (!result.ok) {
    return exportFailure("EXPORT_STORE_FAILED", result.error.message);
  }
  return { ok: true, artifact: { hash: result.value } };
}

function exportFailure(
  code: ExportErrorCode,
  message: string,
): { ok: false; error: JobExecutionError } {
  return { ok: false, error: { code, message, retryable: false } };
}
