import { RunIndex } from "@lcase/types";
import { ArtifactsPort } from "../artifacts/artifacts.port.js";
import { EventBusPort } from "../bus/event-bus.port.js";
import { EmitterFactoryPort } from "../events/emitter-factory.port.js";
import { JobParserPort } from "../events/job-parser.port.js";
import { IndexStorePort } from "../index-store/index-store.port.js";

export type EngineDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  // flowParser: FlowParserPort;
  jobParser: JobParserPort;
  runIndexStore: IndexStorePort<RunIndex>;
  artifacts: ArtifactsPort;
};
