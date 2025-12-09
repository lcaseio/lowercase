import type { StepArgs } from "@lcase/specs";
import type { RunContext } from "@lcase/types/engine";

/**
 * internally here language is currently evolving.
 *
 * selector - the actual string in the flow, like: ${a.path.like.this}
 * path - a parsed version of the selector so each part is broken up for traversal
 * so a path is like a way to get to the value, not the actual selector.
 *
 * may be clearer to make a selector always called either "selector" or "path"
 * unsure.
 *
 * In general, resolving should be refactored to help auto resolve step fields
 * per step type, and deep nested values.
 */

export type ResolveStepArgs = typeof resolveStepArgs;
export function split(path: string): string[] {
  return path ? path.split(".") : [];
}

export function resolveFlatFields(
  fields: Record<string, string>,
  object: Record<string, unknown>
): Record<string, unknown> {
  const fieldValues: Record<string, unknown> = {};
  for (const [field, selector] of Object.entries(fields)) {
    console.log("rs field", field);
    const isSelector = getSelector(selector);
    if (!isSelector) continue;
    const value = resolvePath(isSelector, object);
    fieldValues[field] = value;
  }
  return fieldValues;
}
export function resolveSelector(
  selector: string,
  object: Record<string, unknown>
) {
  const path = getSelector(selector);
  if (!path) return;
  const parts = parsePath(path);
  return extractPathValue(parts, object);
}

export function resolvePath(path: string, object: Record<string, unknown>) {
  if (!path) return;
  const parts = parsePath(path);
  return extractPathValue(parts, object);
}

// dig through object to see if we can get a data type from context
export function extractPathValue<T = unknown>(
  parts: Part[],
  obj: Record<string, unknown>
): T | unknown {
  let current: unknown = obj;

  for (const p of parts) {
    if (current === null) return null;

    if (Array.isArray(current) && p.type === "arrayIndex") {
      current = (current as unknown[])[Number(p.id)];
    } else if (
      p.type === "objectKey" &&
      typeof current === "object" &&
      p.id in current
    ) {
      current = (current as Record<string, unknown>)[p.id];
    }
  }

  return current;
}

export function parseArray(part: string): { key?: string; index?: string[] } {
  // pull out the name and any array index
  // not robust, just easy.

  const regex = /([a-zA-Z0-9\-\_]+)/gm;
  const match = part.match(regex);
  if (!match) return {};

  return { key: match[0], index: match.slice(1) };
}

export function resolveStepArgs(
  context: RunContext,
  stepArgs: StepArgs
): Record<string, unknown> {
  if (!stepArgs) return {};
  // one level deep not recursive
  for (const [k, v] of Object.entries(stepArgs)) {
    if (typeof v === "string") {
      // see if its a selector
      const selector = getSelector(v);
      if (selector) {
        const contextValue = getContextValue(context, selector);
        stepArgs[k] = contextValue;
      }
    }
  }
  return stepArgs;
}

// see if a string is a selector
export function getSelector(arg: string): string | false {
  const regex = /^\${([a-zA-Z0-9\-\[\]_\.]+)}$/; // ${text.like.this[3][3].ok}
  const match = arg.match(regex);

  if (!match) return false;
  // console.log(`[resolver] found match ${match[1]} in arg ${arg}`);
  return match[1];
}

export function getContextValue(
  context: RunContext,
  selector: string
): Record<string, unknown> | undefined {
  const [root, stepName, ...keys] = selector.split(".");
  if (keys.length === 0 || root !== "steps" || !stepName) return;
  if (!context.steps[stepName]) return;

  // console.log(`[resolver] got keys ${keys}`);

  // selector steps.transcribe.text.url
  // keys = ["text", "url"]

  // console.log(`[resolver] full context\n`, JSON.stringify(context, null, 2));

  let c: Record<string, unknown> | undefined = context.steps[stepName].result;
  if (!c) return;

  for (const k of keys) {
    if (!c || typeof c !== "object" || !(k in c)) return;
    c = c[k] as Record<string, unknown>;
  }
  return c;
}
export type Part = { id: string; type: "objectKey" | "arrayIndex" };
export function parsePath(path: string): Part[] {
  const partArray: Part[] = [];
  const parts = path.split(".");
  for (const part of parts) {
    const { key, index } = parseArray(part);
    if (key && index) {
      partArray.push({ id: key, type: "objectKey" });
      for (const i of index) {
        partArray.push({ id: i, type: "arrayIndex" });
      }
    }
  }
  return partArray;
}
