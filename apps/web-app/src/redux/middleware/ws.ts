import { createAction, type Middleware } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { AnyEvent } from "@lcase/types";

export type WsStatus = {
  status: "open" | "closed" | "connecting" | "error";
  reason?: string;
};

export const wsConnect = createAction<{ url: string }>("ws/connect");
export const wsDisconnect = createAction("ws/disconnect");
export const wsStatus = createAction<WsStatus>("ws/setStatus");
export const wsSend = createAction<{ message: string }>("ws/send");

export const eventsBatch = createAction<{ events: AnyEvent[] }>("events/batch");

type DispatchEventsBatch = (action: ReturnType<typeof eventsBatch>) => unknown;

export const createWsMiddleware = (): Middleware<unknown, RootState> => {
  let socket: WebSocket | null = null;
  let buffer: AnyEvent[] = [];
  let rafScheduled = false;

  const scheduleFlush = (dispatch: DispatchEventsBatch) => {
    if (rafScheduled) return;
    rafScheduled = true;

    requestAnimationFrame(() => {
      rafScheduled = false;
      if (buffer.length === 0) return;
      const batch = buffer;
      buffer = [];
      dispatch(eventsBatch({ events: batch }));
    });
  };

  return (store) => (next) => (action) => {
    if (wsConnect.match(action)) {
      if (socket) return next(action);
      const { url } = action.payload;
      store.dispatch(wsStatus({ status: "connecting" }));

      // if socket exists, dont create a new one
      // if (socket) {
      //   socket.close();
      //   socket = null;
      // }

      socket = new WebSocket(url);
      socket.onopen = () => store.dispatch(wsStatus({ status: "open" }));
      socket.onclose = (e) =>
        store.dispatch(
          wsStatus({ status: "closed", reason: `${e.code} ${e.reason}` }),
        );
      socket.onerror = (e) =>
        store.dispatch(wsStatus({ status: "error", reason: `${e.type}` }));

      socket.onmessage = (e) => {
        console.log("msg", e);
        const event = parseEvent(e.data);
        if (!event) return;
        buffer.push(event);
        // limit buffer size to 5000 as a safeguard for memory purposes.
        // slides a window to the latest 5000 messages
        if (buffer.length > 5000) buffer.splice(0, buffer.length - 5000);
      };

      scheduleFlush(store.dispatch);
    }
    if (wsSend.match(action)) {
      if (socket) {
        socket.send(action.payload.message);
      }
    }

    if (wsDisconnect.match(action)) {
      if (socket) socket.close();
      socket = null;
      rafScheduled = false;
      store.dispatch(
        wsStatus({ status: "closed", reason: "Manually closed connection" }),
      );
    }
    return next(action);
  };
};

/**
 * Helper function to parse event envelopes.  Just parses JSON, does not
 * implement zod yet.
 * @param json JSON string
 * @returns AnyEvent or null
 */

function parseEvent(json: string): AnyEvent | null {
  try {
    const data = JSON.parse(json);
    return data as AnyEvent;
  } catch {
    return null;
  }
}
