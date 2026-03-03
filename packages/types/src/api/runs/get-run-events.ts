import { AnyEvent } from "../../events/any-event.js";

type RunId = string;
type EventId = string;
export type GetRunEventsReq = { runId: string };
export type GetRunEventsRes =
  | {
      ok: true;
      events: AnyEvent[];
    }
  | { ok: false; error: string };
