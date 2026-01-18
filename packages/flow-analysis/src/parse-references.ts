import type { FlowProblem, Path, Ref, StepDefinition } from "@lcase/types";
import { traverse } from "./traverse.js";

export function parseStepRefs<D extends StepDefinition>(
  step: D,
  stepId: string,
): { refs: Ref[]; problems: FlowProblem[] } {
  const refs: Ref[] = [];
  const problems: FlowProblem[] = [];

  for (const key in step) {
    const k = key as keyof D;
    // ignore fields which impact control flow in engine
    if (k === "type" || k === "on" || k === "next") continue;
    traverse(
      step[k],
      (value, path) => parseRef(value, path, stepId, refs, problems),
      [String(k)],
    );
  }
  return { refs, problems };
}

export function parseRef(
  value: unknown,
  bindPath: Path,
  stepId: string,
  refs: Ref[],
  problems: FlowProblem[],
): void {
  if (typeof value !== "string") return;
  const matches = getRefStrings(value);

  for (let i = 0; i < matches.length; i++) {
    const matchedString = matches[i][i + 1];
    const matchedScope = matches[i][i + 2];

    const path = makePath(matchedString);

    const ref: Ref = {
      valuePath: path,
      scope: "steps",
      stepId,
      bindPath,
      string: matchedString,
      interpolated: false,
      hash: null,
    };
    if (matchedScope === "steps") {
      refs.push(ref);
    } else if (matchedScope === "input") {
      ref.scope = "input";
      refs.push(ref);
    } else if (matchedScope === "env") {
      ref.scope = "env";
      refs.push(ref);
    } else {
      problems.push({
        type: "InvalidRefScope",
        refString: matchedString,
        stepId,
        bindPath,
      });
    }
  }
}

export function getRefStrings(value: string): RegExpExecArray[] {
  // {{steps.like.this[3][3].ok}}
  const regex = /{{((input|steps|env)\.[a-zA-Z0-9\-\[\]_\.]+)}}/g;
  const matches = [...value.matchAll(regex)];
  return matches;
}

/**
 * Parses a string and creates a new Path array of strings or numbers
 * to traverse dynamically.
 * @param templateString object/array look up type string
 * @returns Path
 */
export function makePath(templateString: string): Path {
  const path: Path = [];
  const parts = templateString.split(".");
  for (const part of parts) {
    const { key, index } = parseArray(part);
    if (key && index) {
      path.push(key);
      for (const i of index) path.push(Number(i));
    }
  }
  return path;
}

/**
 * Takes an individual section of the template string and returns either
 * the object or array portions.
 * @param part A section of a template string
 * @returns { key?: string; index?: string[] }
 */
export function parseArray(part: string): { key?: string; index?: string[] } {
  // pull out the name and any array index
  // not robust, just simple
  const regex = /([a-zA-Z0-9\-\_]+)/gm;
  const match = part.match(regex);
  if (!match) return {};

  return { key: match[0], index: match.slice(1) };
}
