import type { ArtifactReaderPort } from "../artifacts/artifact-reader.port.js";
import type { EventBusPort } from "../bus/event-bus.port.js";
import type { EmitterFactoryPort } from "../events/emitter-factory.port.js";
import type { JobParserPort } from "../events/job-parser.port.js";
import type { RunQueryPort } from "../run/run-query.port.js";
import type { JobExecutionPort } from "../job-execution/job-execution.port.js";

export type EngineDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  // flowParser: FlowParserPort;
  jobParser: JobParserPort;
  runQuery: RunQueryPort;
  artifacts: ArtifactReaderPort;
  jobExecution: JobExecutionPort;
};
