import type { FlowDefinition, JsonValue, Ref } from "@lcase/types";
import { resolvePath, resolveJsonPath } from "@lcase/json-ref-binder/resolve-path";

export type ParamArtifactContent =
  | { format: "json"; value: JsonValue }
  | { format: "text" | "markdown"; value: string };

export type ParamRefUsage = {
  ref: Ref;
  resolved: boolean;
  originalField: unknown;
  interpolatedResult: unknown;
};

export function findParamRefs(refs: Ref[], paramName: string): Ref[] {
  return refs.filter((r) => r.scope === "params" && r.valuePath[1] === paramName);
}

export function buildParamRefUsage(
  ref: Ref,
  flowDef: FlowDefinition,
  artifact: ParamArtifactContent,
): ParamRefUsage {
  const step = flowDef.steps[ref.stepId] as unknown as Record<string, unknown>;
  const originalField = resolvePath(ref.bindPath, step);
  const resolvedValue =
    artifact.format === "json"
      ? resolveJsonPath(ref.valuePath.slice(2), artifact.value)
      : artifact.value;

  if (resolvedValue === undefined) {
    return { ref, resolved: false, originalField, interpolatedResult: originalField };
  }

  return {
    ref,
    resolved: true,
    originalField,
    interpolatedResult: interpolateRefLocal(originalField, resolvedValue, ref),
  };
}

export function interpolateRefLocal(
  field: unknown,
  value: unknown,
  ref: Ref,
): unknown {
  if (ref.interpolated && typeof field === "string") {
    const stringified =
      typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
    return field.replaceAll(`{{${ref.string}}}`, stringified);
  }
  return value;
}

export function renderParamRefReport(paramName: string, usages: ParamRefUsage[]): string {
  if (usages.length === 0) {
    return `No usages of param "${paramName}" found in this flow.`;
  }

  const sections = usages.map((usage) => {
    const fieldPath = usage.ref.bindPath.join(".");
    const heading = `### Step "${usage.ref.stepId}" — ${fieldPath}`;
    if (!usage.resolved) {
      return `${heading}\n\n_could not resolve \`{{${usage.ref.string}}}\` against the selected artifact_`;
    }
    const resultText =
      typeof usage.interpolatedResult === "string"
        ? usage.interpolatedResult
        : JSON.stringify(usage.interpolatedResult, null, 2);
    return `${heading}\n\n\`\`\`\n${resultText}\n\`\`\``;
  });

  return `## Usages of param "${paramName}"\n\n${sections.join("\n\n")}`;
}
