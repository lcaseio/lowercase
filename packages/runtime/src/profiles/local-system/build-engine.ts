import { Engine } from "@lcase/engine";
import type {
  ArtifactReaderPort,
  EventBusPort,
  JobExecutionPort,
  JobParserPort,
  RunQueryPort,
} from "@lcase/ports";
import type { EmitterFactory } from "@lcase/events";

// Relocated from packages/runtime/src/runtime.ts unchanged -- same reasoning
// as buildObservability: no registry/axis dependency, only moving because
// its old host file is being deleted.
export function buildEngine(
  bus: EventBusPort,
  ef: EmitterFactory,
  jobParser: JobParserPort,
  runQuery: RunQueryPort,
  artifacts: ArtifactReaderPort,
  jobExecution: JobExecutionPort,
): Engine {
  return new Engine({
    bus,
    ef,
    jobParser,
    runQuery,
    artifacts,
    jobExecution,
  });
}
