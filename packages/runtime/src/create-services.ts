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
import { ServicesPort } from "@lcase/ports";
import path from "node:path";
import { FsForkSpecIndexStore } from "@lcase/adapters/fork-spec-index-store";

export function createServices(config: RuntimeConfig): ServicesPort {
  const ctx = makeRuntimeContext(config);
  const flowIndexStore = new FsFlowIndexStore(
    path.join(process.cwd(), "lcase-db/flows/index"),
  );
  const forkSpecIndexStore = new FsForkSpecIndexStore(
    path.join(process.cwd(), "lcase-db/sims/index"),
  );
  const flow = new FlowService(
    ctx.bus,
    ctx.ef,
    new FlowStoreFs(),
    ctx.artifacts,
    flowIndexStore,
  );

  const replay = new ReplayService(ctx.replay);
  const sim = new SimService(
    ctx.artifacts,
    ctx.ef,
    ctx.runIndexStore,
    forkSpecIndexStore,
  );
  forkSpecIndexStore.init();
  const ws = new WsService(ctx.bus);
  const run = new RunService(ctx.ef, ctx.runIndexStore, flowIndexStore);

  const artifact = new ArtifactService(ctx.artifacts);

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
