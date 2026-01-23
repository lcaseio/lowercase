import { RunIndex } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";
import { isRunIndexEvent } from "./utils/is-run-index-event.js";

/**
 * Inits a RunIndex object based on the supplied event, if it is a
 * event relevant to creating the run index.  If its not relevant, returns
 * undefined.  If it is, creates the minimum RunIndex from that event's details.
 * @param event AnyEvent
 * @returns RunIndex or undefined
 */
export function initRunIndex(event: AnyEvent): RunIndex | undefined {
  if (!isRunIndexEvent(event)) return;
  const index: RunIndex = {
    flowId: event.flowid,
    steps: {},
    traceId: event.traceid,
  };
  return index;
}
