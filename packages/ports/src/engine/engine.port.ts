import type { ArtifactsPort } from "../artifacts/artifacts.port.js";
import type { EventBusPort } from "../bus/event-bus.port.js";
import type { EmitterFactoryPort } from "../events/emitter-factory.port.js";
import type { JobParserPort } from "../events/job-parser.port.js";
import type { RunQueryPort } from "../run/run-query.port.js";
import type { JobExecutorPort } from "./job-executor.port.js";

export type EngineDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  // flowParser: FlowParserPort;
  jobParser: JobParserPort;
  runQuery: RunQueryPort;
  artifacts: ArtifactsPort;
  jobExecutor: JobExecutorPort;
};
