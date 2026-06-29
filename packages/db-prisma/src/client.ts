import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/client/client.js";
import path from "node:path";

const connectionString =
  process.env.DATABASE_URL ??
  `file:${path.resolve(process.cwd(), "lcase-db/metadata.sqlite")}`;
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
