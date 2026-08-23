import type { AnyEvent } from "../../events/any-event.js";

export type GetRunEventsReq = { runId: string };
export type GetRunEventsRes =
  | {
      ok: true;
      events: AnyEvent[];
    }
  | { ok: false; error: string };
