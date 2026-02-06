import { FastifyInstance } from "fastify";
import { PostRunsReq, PostRunsRes } from "@lcase/types";
import { sockets } from "../ws-route.js";

export const requestRunsRoute = async (app: FastifyInstance) => {
  app.post<{ Body: PostRunsReq }>(
    "/",
    async (req, rep): Promise<PostRunsRes> => {
      const { flowDefHash } = req.body;
      const validFowDefHash = validateFlowHash(flowDefHash);
      if (!validFowDefHash) return { ok: false, error: "Invalid flowDefHash" };

      const runId = app.services.run.makeRunId();

      if (sockets.has("client")) {
        const s = sockets.get("client");
        console.log("s undef?:", s === undefined);
        app.services.ws.monitorRun(runId, s as unknown as WebSocket);
        console.log("monitoring run");
      }
      await app.services.run.requestRun(
        validFowDefHash,
        "lowercase://http-server",
        runId,
      );
      return { ok: true };
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
