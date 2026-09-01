import path from "path";
import type {
  ArtifactReaderPort,
  EventBusPort,
  RunQueryPort,
} from "@lcase/ports";
import {
  ConsoleSink,
  ObservabilityTap,
  ReplaySink,
  SqlRunProjectionSink,
  EvalResultProjectionSink,
  WebSocketServerSink,
} from "@lcase/observability";
import { PrismaRunRepository } from "@lcase/adapters/run-repository";
import { PrismaRunStepProjectionRepository } from "@lcase/adapters/run-step-projection-repository";
import { PrismaEvalResultRepository } from "@lcase/adapters/eval-result-repository";
import { JsonlEventLog } from "@lcase/adapters/event-store";
import { prisma } from "../../../../db-prisma/dist/client.js";
import type { ObservabilityConfig } from "../../config/observability.config.js";

export type SinkMap = {
  "console-log-sink"?: ConsoleSink;
  "websocket-sink"?: WebSocketServerSink;
  "replay-jsonl-sink"?: ReplaySink;
};

// Relocated from packages/runtime/src/runtime.ts unchanged -- this function
// has no registry/axis dependency, it's already the right composition
// shape, and is only moving because its old host file is being deleted.
export function buildObservability(
  config: ObservabilityConfig,
  bus: EventBusPort,
  artifacts: ArtifactReaderPort,
  runQuery: RunQueryPort,
): { tap: ObservabilityTap; sinks: SinkMap } {
  const tap = new ObservabilityTap(bus);
  const sinks: SinkMap = {};
  tap.attachSink(
    new SqlRunProjectionSink(
      new PrismaRunRepository(prisma),
      new PrismaRunStepProjectionRepository(prisma),
    ),
  );
  tap.attachSink(
    new EvalResultProjectionSink(
      new PrismaEvalResultRepository(prisma),
      artifacts,
      runQuery,
    ),
  );
  if (config.sinks) {
    for (const sink of config.sinks) {
      // TODO: move sink settings to config, not hardcoded
      switch (sink) {
        case "console-log-sink":
          const consoleSink = new ConsoleSink({
            allVerbose: false,
            verboseEvents: new Set([
              "job.httpjson.started",
              "tool.failed",
              "tool.completed",
            ]),
          });
          sinks["console-log-sink"] = consoleSink;
          tap.attachSink(consoleSink);
          break;
        case "websocket-sink":
          if (config.webSocketPort !== undefined) {
            const webSocketServerSink = new WebSocketServerSink(
              config.webSocketPort,
            );
            sinks["websocket-sink"] = webSocketServerSink;
            tap.attachSink(webSocketServerSink);
          }
          break;
        case "replay-jsonl-sink":
          const absoluteDirPath = path.resolve(
            process.cwd(),
            "lcase-db/replay",
          );
          const replaySink = new ReplaySink(new JsonlEventLog(absoluteDirPath));
          sinks["replay-jsonl-sink"] = replaySink;
          tap.attachSink(replaySink);

          break;
        default:
          break;
      }
    }
  }
  return { tap, sinks };
}
