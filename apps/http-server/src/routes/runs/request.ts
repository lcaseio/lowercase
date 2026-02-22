import { FastifyInstance } from "fastify";
import { PostRunsReq, PostRunsRes } from "@lcase/types";
import { sockets } from "../ws-route.js";

export const requestRunsRoute = async (app: FastifyInstance) => {
  app.post<{ Body: PostRunsReq }>(
    "/",
    async (req, rep): Promise<PostRunsRes> => {
      const { flowDefHash, forkSpecHash } = req.body;
      const validFlowDefHash = validateFlowHash(flowDefHash);

      if (!validFlowDefHash) return { ok: false, error: "Invalid flowDefHash" };

      const runId = app.services.run.makeRunId();

      if (sockets.has("client")) {
        const s = sockets.get("client");
        console.log("s undef?:", s === undefined);
        app.services.ws.monitorRun(runId, s as unknown as WebSocket);
        console.log("monitoring run");
      }
      await app.services.run.requestRun({
        flowDefHash: validFlowDefHash,
        source: "lowercase://http-server",
        runId,
        forkSpecHash,
      });
      return { ok: true, runId };
    },
  );
};

export function validateFlowHash(hash: unknown) {
  if (typeof hash !== "string") return;
  const regex = /^[a-zA-Z0-9]+$/;
  const match = hash.match(regex);
  if (!match) return;
  return match[0];
}
