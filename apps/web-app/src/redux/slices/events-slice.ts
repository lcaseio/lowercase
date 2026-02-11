import type { AnyEvent } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { eventsBatch } from "../middleware/ws";

type EventId = string;
type RunId = string;
type EventsState = {
  ids: EventId[];
  events: Record<EventId, AnyEvent>;
  runEventIds: Record<RunId, EventId[]>;
  maxEvents: number;
};

export function hasRunId(
  event: AnyEvent,
): event is AnyEvent & { runid: string } {
  const e = event as unknown as Record<string, unknown>;
  return typeof e.runid === "string";
}
const initialState: EventsState = {
  events: {},
  ids: [],
  maxEvents: 5000,
  runEventIds: {},
};

export const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearAll: (state) => {
      state.events = {};
      state.ids = [];
      state.runEventIds = {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      eventsBatch,
      (state, action: PayloadAction<{ events: AnyEvent[] }>) => {
        // add events to state
        for (const event of action.payload.events) {
          if (state.events[event.id]) continue;
          state.events[event.id] = event;
          state.ids.push(event.id);

          if (hasRunId(event)) {
            (state.runEventIds[event.runid] ??= []).push(event.id);
          }
        }

        // trim state to sliding window
        const overflow = state.ids.length - state.maxEvents;
        if (overflow <= 0) return;

        const idsToDelete = state.ids.splice(0, overflow);
        for (const idToDelete of idsToDelete) {
          const droppedEvent = state.events[idToDelete];
          delete state.events[idToDelete];

          if (hasRunId(droppedEvent)) {
            const runIds = state.runEventIds[droppedEvent.runid];
            if (!runIds) return;
            state.runEventIds[droppedEvent.runid] = runIds.filter(
              (eventId) => eventId !== idToDelete,
            );
            if (state.runEventIds[droppedEvent.runid].length === 0) {
              delete state.runEventIds[droppedEvent.runid];
            }
          }
        }
      },
    );
  },
});

export const { clearAll } = eventsSlice.actions;
