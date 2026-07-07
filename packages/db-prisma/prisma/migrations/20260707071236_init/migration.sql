-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Artifact" (
    "hash" TEXT NOT NULL PRIMARY KEY,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT,
    "filename" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "format" TEXT
);

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

-- CreateTable
CREATE TABLE "Run" (
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
    "startTime" DATETIME,
    "endTime" DATETIME,
    "duration" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Run_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Run_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Run_simId_fkey" FOREIGN KEY ("simId") REFERENCES "Sim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunParam" (
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artifactHash" TEXT NOT NULL,

    PRIMARY KEY ("runId", "name"),
    CONSTRAINT "RunParam_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunStepProjection" (
    "runId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" TEXT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "duration" REAL,
    "reusedTime" DATETIME,
    "wasReused" BOOLEAN,
    "outputHash" TEXT,

    PRIMARY KEY ("runId", "stepId"),
    CONSTRAINT "RunStepProjection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunStepExport" (
    "runId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artifactHash" TEXT NOT NULL,

    PRIMARY KEY ("runId", "stepId", "name"),
    CONSTRAINT "RunStepExport_runId_stepId_fkey" FOREIGN KEY ("runId", "stepId") REFERENCES "RunStepProjection" ("runId", "stepId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FlowVersion_flowId_idx" ON "FlowVersion"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowVersion_flowId_sequence_key" ON "FlowVersion"("flowId", "sequence");

-- CreateIndex
CREATE INDEX "Artifact_time_idx" ON "Artifact"("time");

-- CreateIndex
CREATE INDEX "Sim_createdAt_idx" ON "Sim"("createdAt");

-- CreateIndex
CREATE INDEX "Sim_flowId_idx" ON "Sim"("flowId");

-- CreateIndex
CREATE INDEX "Sim_flowVersionId_idx" ON "Sim"("flowVersionId");

-- CreateIndex
CREATE INDEX "Run_createdAt_idx" ON "Run"("createdAt");

-- CreateIndex
CREATE INDEX "Run_flowId_idx" ON "Run"("flowId");

-- CreateIndex
CREATE INDEX "Run_flowVersionId_idx" ON "Run"("flowVersionId");

-- CreateIndex
CREATE INDEX "Run_simId_idx" ON "Run"("simId");

-- CreateIndex
CREATE INDEX "Run_parentRunId_idx" ON "Run"("parentRunId");

-- CreateIndex
CREATE INDEX "RunParam_artifactHash_idx" ON "RunParam"("artifactHash");

-- CreateIndex
CREATE INDEX "RunStepProjection_runId_idx" ON "RunStepProjection"("runId");

-- CreateIndex
CREATE INDEX "RunStepProjection_status_idx" ON "RunStepProjection"("status");

-- CreateIndex
CREATE INDEX "RunStepExport_artifactHash_idx" ON "RunStepExport"("artifactHash");
