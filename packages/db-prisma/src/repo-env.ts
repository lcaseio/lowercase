import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Found by walking up for the workspace marker rather than by a counted number
 * of `..` segments. A fixed depth would be right from `dist/` and silently wrong
 * from `src/`, which matters because the Prisma config files import this before
 * anything is built.
 */
function findRepoRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        "[db-prisma] could not locate the repo root: no pnpm-workspace.yaml above this module.",
      );
    }
    dir = parent;
  }
}

export const repoRoot = findRepoRoot();

/**
 * Loads the repo-root `.env`, which is the only one anything here reads.
 *
 * Called by every default-URL function rather than at module load, so that both
 * providers honour the same file. A default that silently ignores `.env` on one
 * branch and honours it on the other is the exact shape of the two faults C17
 * recorded: the value looks set, something reads a stale default instead, and
 * the failure surfaces somewhere else entirely.
 */
export function loadRepoEnv(): void {
  dotenv.config({ path: path.join(repoRoot, ".env"), quiet: true });
}
