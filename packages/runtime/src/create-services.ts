import {
  ArtifactService,
  FlowService,
  ReplayService,
  RunService,
  SimService,
  SystemService,
  WsService,
} from "@lcase/services";
import { RuntimeConfig } from "./types/runtime.config.js";
import { makeRuntimeContext } from "./runtime.js";
import { FlowStoreFs } from "@lcase/adapters/flow-store";
import { FsFlowIndexStore } from "@lcase/adapters/flow-index-store";
import { PrismaArtifactRepository } from "@lcase/adapters/artifact-repository";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { PrismaSimRepository } from "@lcase/adapters/sim-repository";
import { ServicesPort } from "@lcase/ports";
import path from "node:path";
// import { FsRunParamsIndexStore } from "@lcase/adapters/run-params-index-store";
import { FsJsonIndexStore } from "../../adapters/dist/index-store/fs-json-index-store.js";
import { FlowIndex, RunIndex } from "@lcase/types";
import { prisma } from "../../db-prisma/dist/client.js";

export function createServices(config: RuntimeConfig): ServicesPort {
  const ctx = makeRuntimeContext(config);
  const flowIndexStoreOld = new FsFlowIndexStore(
    path.join(process.cwd(), "lcase-db/flows/index"),
  );
  // const forkSpecIndexStore = new FsForkSpecIndexStore(
  //   path.join(process.cwd(), "lcase-db/sims/index"),
  // );
  // const runParamsIndexStore = new FsRunParamsIndexStore(
  //   path.join(process.cwd(), "lcase-db/params/index"),
  // );

  const flowIndexStore = new FsJsonIndexStore<FlowIndex>({
    dir: path.join(process.cwd(), "lcase-db/flows/index"),
    extension: ".index.json",
  });

  const artifactRepository = new PrismaArtifactRepository(prisma);
  const flowRepository = new PrismaFlowRepository(prisma);
  const simRepository = new PrismaSimRepository(prisma);

  const flow = new FlowService(
    ctx.bus,
    ctx.ef,
    new FlowStoreFs(),
    ctx.artifacts,
    flowRepository,
  );

  const replay = new ReplayService(ctx.replay);
  const sim = new SimService(
    ctx.artifacts,
    ctx.ef,
    ctx.runIndexStore,
    simRepository,
    flowRepository,
  );
  // runParamsIndexStore.init();
  const ws = new WsService(ctx.bus);
  const run = new RunService({
    ef: ctx.ef,
    runStore: ctx.runIndexStore,
    flowStore: flowIndexStore,
    // runParamsStore: runParamsIndexStore,
  });

  const artifact = new ArtifactService(ctx.artifacts, artifactRepository);

  const system = new SystemService({
    bus: ctx.bus,
    ef: ctx.ef,
    engine: ctx.engine,
    limiter: ctx.limiter,
    router: ctx.router,
    sinks: ctx.sinks,
    tap: ctx.tap,
    worker: ctx.worker,
  });

  return { flow, replay, sim, system, run, ws, artifact };
}
