-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArtifactParamCuration" (
    "artifactHash" TEXT NOT NULL,
    "flowVersionId" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,

    PRIMARY KEY ("artifactHash", "flowVersionId", "paramName"),
    CONSTRAINT "ArtifactParamCuration_artifactHash_fkey" FOREIGN KEY ("artifactHash") REFERENCES "Artifact" ("hash") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArtifactParamCuration_flowVersionId_fkey" FOREIGN KEY ("flowVersionId") REFERENCES "FlowVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArtifactParamCuration" ("artifactHash", "flowVersionId", "paramName") SELECT "artifactHash", "flowVersionId", "paramName" FROM "ArtifactParamCuration";
DROP TABLE "ArtifactParamCuration";
ALTER TABLE "new_ArtifactParamCuration" RENAME TO "ArtifactParamCuration";
CREATE INDEX "ArtifactParamCuration_artifactHash_idx" ON "ArtifactParamCuration"("artifactHash");
CREATE INDEX "ArtifactParamCuration_flowVersionId_idx" ON "ArtifactParamCuration"("flowVersionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
