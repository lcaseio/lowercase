-- AlterTable
ALTER TABLE "Run" ADD COLUMN "experimentId" TEXT;
ALTER TABLE "Run" ADD COLUMN "targetExportName" TEXT;
ALTER TABLE "Run" ADD COLUMN "targetRunId" TEXT;
ALTER TABLE "Run" ADD COLUMN "targetStepId" TEXT;

-- CreateTable
CREATE TABLE "EvalResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetRunId" TEXT NOT NULL,
    "targetStepId" TEXT,
    "targetExportName" TEXT,
    "evalRunId" TEXT NOT NULL,
    "evalFlowId" TEXT,
    "evalFlowVersionId" TEXT,
    "experimentId" TEXT,
    "overall" REAL NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvalResult_targetRunId_fkey" FOREIGN KEY ("targetRunId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvalResult_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'business',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Flow" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Flow";
DROP TABLE "Flow";
ALTER TABLE "new_Flow" RENAME TO "Flow";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EvalResult_targetRunId_idx" ON "EvalResult"("targetRunId");

-- CreateIndex
CREATE INDEX "EvalResult_evalRunId_idx" ON "EvalResult"("evalRunId");

-- CreateIndex
CREATE INDEX "EvalResult_experimentId_idx" ON "EvalResult"("experimentId");

-- CreateIndex
CREATE INDEX "EvalResult_createdAt_idx" ON "EvalResult"("createdAt");

-- CreateIndex
CREATE INDEX "Run_experimentId_idx" ON "Run"("experimentId");
