import type { Path } from "@lcase/types";

export function resolvePath(
  path: Path,
  object: Record<string, unknown>
): unknown {
  let current: unknown = object;
  for (const token of path) {
    if (typeof token === "number" && Array.isArray(current)) {
      current = (current as unknown[])[token as number];
    } else if (
      typeof token === "string" &&
      typeof current === "object" &&
      current !== null
    ) {
      current = (current as Record<string, unknown>)[token];
    } else return;
  }
  return current;
}
