import dotenv from "dotenv";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/client/client.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
const envPath = path.join(repoRoot, ".env");

dotenv.config({ path: envPath });

const connectionString =
  process.env.DATABASE_URL ??
  `file:${path.join(repoRoot, "lcase-db/sqlite/dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
