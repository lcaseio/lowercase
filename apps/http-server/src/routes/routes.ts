import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { listFlowsRoute } from "./flows/get.js";
import { postFlowsRoute } from "./flows/add.js";
import { listRunsRoute } from "./runs/list.js";
import { postFlowsFilesRoute } from "./flows/files/post.js";
import { getFlowDefRoute } from "./flows/get-flow-def.js";
import { requestRunsRoute } from "./runs/request.js";
import { getRunsEventsListRoute } from "./runs/events/events.js";
import { simsListRoute } from "./sims/list.js";
import { postSimsRoute } from "./sims/post.js";
import { getSimSpec } from "./sims/get-sim-spec.js";
import { getRunIndex } from "./runs/get-run-index.js";
import { getArtifactRoute } from "./artifacts/get-artifact.js";
import { putJsonArtifactRoute } from "./artifacts/put-json-artifact.js";
import { postArtifactFileRoute } from "./artifacts/post-artifact-file.js";

export const routes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // api/flows
  await app.register(listFlowsRoute, { prefix: "/api/flows" });
  await app.register(getFlowDefRoute, { prefix: "/api/flows" });
  await app.register(postFlowsRoute, { prefix: "/api/flows" });
  await app.register(postFlowsFilesRoute, { prefix: "/api/flows/files" });

  // api/runs
  await app.register(listRunsRoute, { prefix: "/api/runs" }); // get
  await app.register(getRunIndex, { prefix: "/api/runs" });
  await app.register(requestRunsRoute, { prefix: "/api/runs" }); // post

  // api/runs/details
  await app.register(getRunsEventsListRoute, { prefix: "/api/runs/details" }); // get

  // api/sims
  await app.register(simsListRoute, { prefix: "/api/sims" });
  await app.register(postSimsRoute, { prefix: "/api/sims" });
  await app.register(getSimSpec, { prefix: "/api/sims" });

  // api/artifacts
  await app.register(getArtifactRoute, { prefix: "/api/artifacts" });
  await app.register(putJsonArtifactRoute, { prefix: "/api/artifacts" });
  await app.register(postArtifactFileRoute, { prefix: "/api/artifacts/files" });
};
