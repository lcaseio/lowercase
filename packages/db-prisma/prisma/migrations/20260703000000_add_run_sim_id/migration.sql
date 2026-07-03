PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "flowId" TEXT,
    "flowVersionId" TEXT,
    "flowDefHash" TEXT NOT NULL,
    "simId" TEXT,
    "parentRunId" TEXT,
    "forkSpecHash" TEXT,
    "runParamsHash" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "duration" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Run_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Run_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Run_simId_fkey" FOREIGN KEY ("simId") REFERENCES "Sim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Run" (
    "id",
    "traceId",
    "status",
    "source",
    "flowId",
    "flowVersionId",
    "flowDefHash",
    "simId",
    "parentRunId",
    "forkSpecHash",
    "runParamsHash",
    "startTime",
    "endTime",
    "duration",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "traceId",
    "status",
    "source",
    "flowId",
    "flowVersionId",
    "flowDefHash",
    NULL,
    "parentRunId",
    "forkSpecHash",
    "runParamsHash",
    "startTime",
    "endTime",
    "duration",
    "createdAt",
    "updatedAt"
FROM "Run";

DROP TABLE "Run";
ALTER TABLE "new_Run" RENAME TO "Run";

CREATE INDEX "Run_createdAt_idx" ON "Run"("createdAt");
CREATE INDEX "Run_flowId_idx" ON "Run"("flowId");
CREATE INDEX "Run_flowVersionId_idx" ON "Run"("flowVersionId");
CREATE INDEX "Run_simId_idx" ON "Run"("simId");
CREATE INDEX "Run_parentRunId_idx" ON "Run"("parentRunId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
