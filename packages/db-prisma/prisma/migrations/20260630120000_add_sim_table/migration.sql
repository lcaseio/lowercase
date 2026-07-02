-- CreateTable
CREATE TABLE "Sim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "flowId" TEXT NOT NULL,
    "flowVersionId" TEXT NOT NULL,
    "forkSpecHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sim_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sim_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Sim_createdAt_idx" ON "Sim"("createdAt");

-- CreateIndex
CREATE INDEX "Sim_flowId_idx" ON "Sim"("flowId");

-- CreateIndex
CREATE INDEX "Sim_flowVersionId_idx" ON "Sim"("flowVersionId");
