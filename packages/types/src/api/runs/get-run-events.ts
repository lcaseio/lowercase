import { AnyEvent } from "../../events/any-event.js";

type RunId = string;
type EventId = string;
export type GetRunEventsReq = { runId: string };
export type GetRunEventsRes =
  | {
      ok: true;
      events: Record<EventId, AnyEvent>;
      eventIds: Record<RunId, EventId[]>;
    }
  | { ok: false; error: string };
