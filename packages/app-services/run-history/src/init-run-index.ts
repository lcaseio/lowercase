import { RunIndex } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";
import { isRunIndexEvent } from "./utils/is-run-index-event.js";

export function initRunIndex(event: AnyEvent): RunIndex | undefined {
  if (!isRunIndexEvent(event)) return;
  const index: RunIndex = {
    flowId: event.flowid,
    steps: {},
    traceId: event.traceid,
  };
  return index;
}
