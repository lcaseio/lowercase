-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Artifact" (
    "hash" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,
    "filename" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "format" TEXT,
    "flowId" TEXT,
    "flowVersionId" TEXT,
    "curated" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Artifact_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Artifact_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Artifact" ("contentType", "filename", "flowId", "flowVersionId", "format", "hash", "label", "size", "time") SELECT "contentType", "filename", "flowId", "flowVersionId", "format", "hash", "label", "size", "time" FROM "Artifact";
DROP TABLE "Artifact";
ALTER TABLE "new_Artifact" RENAME TO "Artifact";
CREATE INDEX "Artifact_time_idx" ON "Artifact"("time");
CREATE INDEX "Artifact_flowId_idx" ON "Artifact"("flowId");
CREATE INDEX "Artifact_flowVersionId_idx" ON "Artifact"("flowVersionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
