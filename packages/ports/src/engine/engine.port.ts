import { ArtifactsPort } from "../artifacts/artifacts.port.js";
import { EventBusPort } from "../bus/event-bus.port.js";
import { EmitterFactoryPort } from "../events/emitter-factory.port.js";
import { JobParserPort } from "../events/job-parser.port.js";
import { RunQueryPort } from "../run/run-query.port.js";

export type EngineDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  // flowParser: FlowParserPort;
  jobParser: JobParserPort;
  runQuery: RunQueryPort;
  artifacts: ArtifactsPort;
};
