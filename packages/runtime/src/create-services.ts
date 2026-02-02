import {
  FlowService,
  ReplayService,
  RunService,
  SimService,
  SystemService,
} from "@lcase/services";
import { RuntimeConfig } from "./types/runtime.config.js";
import { makeRuntimeContext } from "./runtime.js";
import { FlowStoreFs } from "@lcase/adapters/flow-store";
import { FsFlowIndexStore } from "@lcase/adapters/flow-index-store";
import { ServicesPort } from "@lcase/ports";
import path from "node:path";

export function createServices(config: RuntimeConfig): ServicesPort {
  const ctx = makeRuntimeContext(config);

  const flow = new FlowService(
    ctx.bus,
    ctx.ef,
    new FlowStoreFs(),
    ctx.artifacts,
    new FsFlowIndexStore(path.join(process.cwd(), "lcase-db/flows/index")),
  );
  const replay = new ReplayService(ctx.replay);
  const sim = new SimService(ctx.artifacts, ctx.ef, ctx.runIndexStore);
  const run = new RunService(ctx.ef);

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

  return { flow, replay, sim, system, run };
}
