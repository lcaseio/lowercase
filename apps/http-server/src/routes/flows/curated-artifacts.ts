import type { FastifyInstance } from "fastify";
import { isHash } from "../../utils/is-hash.js";
import type {
  DeleteCurateArtifactRes,
  GetCuratedArtifactsRes,
  PostCurateArtifactReq,
  PostCurateArtifactRes,
} from "@lcase/types";

export const getCuratedArtifactsForParamRoute = async (
  app: FastifyInstance,
) => {
  app.get<{ Params: { versionId: string; paramName: string } }>(
    "/versions/:versionId/params/:paramName/curated-artifacts",
    async (req): Promise<GetCuratedArtifactsRes> => {
      const { versionId, paramName } = req.params;
      const value = await app.services.artifact.listCuratedArtifacts(
        versionId,
        paramName,
      );
      return { ok: true, value };
    },
  );
};

export const postCurateArtifactForParamRoute = async (app: FastifyInstance) => {
  app.post<{
    Params: { versionId: string; paramName: string };
    Body: PostCurateArtifactReq;
  }>(
    "/versions/:versionId/params/:paramName/curated-artifacts",
    async (req): Promise<PostCurateArtifactRes> => {
      const { versionId, paramName } = req.params;
      const { artifactHash, crossVersion } = req.body;
      if (!isHash(artifactHash)) return { ok: false, error: "Invalid hash" };
      return app.services.artifact.curateArtifactForParam(
        artifactHash,
        versionId,
        paramName,
        crossVersion,
      );
    },
  );
};

export const deleteUncurateArtifactForParamRoute = async (
  app: FastifyInstance,
) => {
  app.delete<{
    Params: { versionId: string; paramName: string; hash: string };
  }>(
    "/versions/:versionId/params/:paramName/curated-artifacts/:hash",
    async (req): Promise<DeleteCurateArtifactRes> => {
      const { versionId, paramName, hash } = req.params;
      if (!isHash(hash)) return { ok: false, error: "Invalid hash" };
      return app.services.artifact.uncurateArtifactForParam(
        hash,
        versionId,
        paramName,
      );
    },
  );
};
