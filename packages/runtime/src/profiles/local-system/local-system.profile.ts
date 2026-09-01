import { InMemoryEventBus } from "@lcase/adapters/event-bus";
import { InMemoryQueue } from "@lcase/adapters/queue";
import { NodeRouter } from "@lcase/router";
import { EmitterFactory, eventSchemaRegistry } from "@lcase/events";
import { JobParser } from "@lcase/events/parsers";
import { LocalWorkerJobExecutor } from "@lcase/integrations/engine-worker";
import { createArtifactReadWritePort } from "@lcase/artifacts";
import { ConcurrencyLimiter, Limiter } from "@lcase/limiter";
import { ReplayEngine } from "@lcase/replay";
import { JsonlEventLog } from "@lcase/adapters/event-store";
import path from "path";
import { PrismaArtifactRepository } from "@lcase/adapters/artifact-repository";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { PrismaRunRepository } from "@lcase/adapters/run-repository";
import { PrismaRunQuery } from "@lcase/adapters/run-query";
import { PrismaSimRepository } from "@lcase/adapters/sim-repository";
import { PrismaEvalResultRepository } from "@lcase/adapters/eval-result-repository";
import {
  ArtifactService,
  EvalService,
  FlowService,
  ReplayService,
  RunService,
  SimService,
} from "@lcase/app-services";
import type { ServicesPort } from "@lcase/ports";
import type { JobExecutorPort } from "@lcase/ports/engine";
import type { ObservabilityTapPort } from "@lcase/ports";
import {
  managedResource,
  assembleEmbeddedSystem,
} from "../../assembly/index.js";
import type { ManagedRuntime } from "../../assembly/index.js";
import { createWorkerCore } from "../../worker/create-worker.js";
import { buildArtifactStore } from "./build-artifact-store.js";
import { buildObservability } from "./build-observability.js";
import { buildEngine } from "./build-engine.js";
import type { LocalSystemConfig } from "../../config/local-system.config.js";
import { prisma } from "../../../../db-prisma/dist/client.js";

export type LocalSystem = {
  services: ServicesPort;
  runtime: ManagedRuntime;
  tap: ObservabilityTapPort;
};

// A clean rewrite of composition, not a retrofit of createServices()/
// createRuntime() -- see docs/milestones/swappable-infrastructure/arcs/
// cas-adapter.md's PR 3 discussion. packages/app-services stays untouched;
// this just constructs those same classes against freshly-assembled
// instances instead of reusing any of the old wiring functions, factories,
// or registries.
export function createLocalSystem(config: LocalSystemConfig): LocalSystem {
  const bus = new InMemoryEventBus();
  const queue = new InMemoryQueue();
  const ef = new EmitterFactory(bus);
  const router = new NodeRouter(bus, queue, ef);

  const jobParser = new JobParser(eventSchemaRegistry);

  const artifactRepository = new PrismaArtifactRepository(prisma);
  const flowRepository = new PrismaFlowRepository(prisma);
  const runRepository = new PrismaRunRepository(prisma);
  const runQuery = new PrismaRunQuery(prisma, artifactRepository);
  const simRepository = new PrismaSimRepository(prisma);
  const evalResultRepository = new PrismaEvalResultRepository(prisma);

  const artifactStore = buildArtifactStore(config.artifacts);
  const artifacts = createArtifactReadWritePort(
    artifactStore,
    artifactRepository,
  );

  const workerCore = createWorkerCore({ artifacts }, config.worker);
  const jobExecutor: JobExecutorPort = new LocalWorkerJobExecutor(workerCore);

  const engine = buildEngine(
    bus,
    ef,
    jobParser,
    runQuery,
    artifacts,
    jobExecutor,
  );

  const { tap, sinks } = buildObservability(
    config.observability,
    bus,
    artifacts,
    runQuery,
  );

  const cl = new ConcurrencyLimiter(bus, ef);
  const limiter = new Limiter(config.limiter.id, config.limiter.scope, {
    bus,
    ef,
    cl,
  });

  const replay = new ReplayEngine(
    new JsonlEventLog(path.resolve(process.cwd(), "lcase-db/replay")),
    bus,
    ef,
  );

  const runtime = assembleEmbeddedSystem({
    bus: managedResource("bus", bus, {
      stop: async (b) => {
        await b.close();
      },
    }),
    router: managedResource("router", router, {
      start: (r) => r.start(),
      stop: (r) => r.stop(),
    }),
    sinks: Object.entries(sinks).map(([id, sink]) =>
      managedResource(id, sink, {
        start: (s) => s.start(),
        stop: (s) => s.stop(),
      }),
    ),
    tap: managedResource("tap", tap, {
      start: (t) => t.start(),
      stop: (t) => t.stop(),
    }),
    engine: managedResource("engine", engine, {
      start: (e) => e.start(),
      stop: (e) => e.stop(),
    }),
    limiter: managedResource("limiter", limiter, {
      start: (l) => l.start(),
      stop: (l) => l.stop(),
    }),
  });

  const flow = new FlowService(artifacts, flowRepository);
  const replayService = new ReplayService(replay);
  const sim = new SimService(
    artifacts,
    ef,
    runQuery,
    simRepository,
    flowRepository,
  );
  const run = new RunService({
    artifactRepository,
    artifacts,
    ef,
    runRepository,
    runQuery,
  });
  const artifact = new ArtifactService(
    artifacts,
    artifactRepository,
    flowRepository,
  );
  const evalService = new EvalService({
    runService: run,
    runQuery,
    runRepository,
    artifacts,
    evalResults: evalResultRepository,
  });

  const services: ServicesPort = {
    flow,
    replay: replayService,
    sim,
    run,
    artifact,
    eval: evalService,
  };

  return { services, runtime, tap };
}
