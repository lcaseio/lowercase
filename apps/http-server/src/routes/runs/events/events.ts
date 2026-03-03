import { GetRunEventsReq, GetRunEventsRes } from "@lcase/types";
import { FastifyInstance } from "fastify";

export const getRunsEventsListRoute = async (app: FastifyInstance) => {
  app.get<{ Querystring: GetRunEventsReq }>(
    "/",
    async (req, reply): Promise<GetRunEventsRes> => {
      const { runId } = req.query;
      if (!isRunId(runId)) return { ok: false, error: "Invalid Run ID" };

      try {
        const result = await app.services.replay.getAllEvents(runId);
        return { ok: true, events: result.events };
      } catch (err) {
        console.error(err);
        return { ok: false, error: `Error getting events` };
      }
    },
  );
};

/**
 * Narrows the type of run id if is a valid flow id string
 * @param runId unknown
 * @returns
 */
export function isRunId(runId: unknown): runId is string {
  if (typeof runId !== "string") return false;
  const regex = /^run-[a-zA-Z0-9\-]+$/;
  const match = runId.match(regex);

  if (!match) return false;
  return true;
}
