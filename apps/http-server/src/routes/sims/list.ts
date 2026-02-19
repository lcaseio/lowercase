import { GetSimsRes } from "@lcase/types";
import type { FastifyInstance } from "fastify";

type ForkSpecListItem = {
  flowDefName: string;
  flowDefVersion: string;
  flowDefDescription?: string;
  parentRunId?: string;
};

export const simsListRoute = async (app: FastifyInstance) => {
  app.get("/", async (req, reply): Promise<GetSimsRes> => {
    const listItems: ForkSpecListItem[] = [];
    const forkSpecIndexes = await app.services.sim.getAllForkSpecIndexes();
    console.log("fsi", forkSpecIndexes.length);
    for (const forkSpecIndex of forkSpecIndexes) {
      const flowDef = await app.services.flow.getFlowDef(
        forkSpecIndex.flowDefHash,
      );
      if (!flowDef.ok) continue;
      listItems.push({
        flowDefName: flowDef.value.name,
        flowDefVersion: flowDef.value.version,
        flowDefDescription: flowDef.value.description,
      });
    }
    return { ok: true, forkSpecList: listItems };
  });
};
