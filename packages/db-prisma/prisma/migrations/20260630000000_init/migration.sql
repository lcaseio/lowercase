CREATE TABLE "Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "FlowVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "definitionHash" TEXT NOT NULL,
    "versionLabel" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlowVersion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Artifact" (
    "hash" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,
    "filename" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "format" TEXT
);

CREATE INDEX "FlowVersion_flowId_idx" ON "FlowVersion"("flowId");
CREATE UNIQUE INDEX "FlowVersion_flowId_sequence_key" ON "FlowVersion"("flowId", "sequence");
CREATE INDEX "Artifact_time_idx" ON "Artifact"("time");
