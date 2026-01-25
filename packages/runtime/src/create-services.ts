import {
  FlowService,
  ReplayService,
  SimService,
  SystemService,
} from "@lcase/services";
import { RuntimeConfig } from "./types/runtime.config.js";
import { makeRuntimeContext } from "./runtime.js";
import { FlowStoreFs } from "@lcase/adapters/flow-store";
import { ServicesPort } from "@lcase/ports";

export function createServices(config: RuntimeConfig): ServicesPort {
  const ctx = makeRuntimeContext(config);

  const flow = new FlowService(ctx.bus, ctx.ef, new FlowStoreFs());
  const replay = new ReplayService(ctx.replay);
  const sim = new SimService(ctx.artifacts, ctx.ef, ctx.runIndexStore);

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

  return { flow, replay, sim, system };
}
