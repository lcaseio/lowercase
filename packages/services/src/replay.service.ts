import type { ReplayServicePort } from "@lcase/ports";
import type { ReplayEnginePort } from "@lcase/ports/replay";
import { AnyEvent } from "@lcase/types";

type RunId = string;
type EventId = string;
export class ReplayService implements ReplayServicePort {
  constructor(private replay: ReplayEnginePort) {}

  async replayRun(runId: string) {
    await this.replay.emitReplayMode(runId, false);
    await this.replay.replayAllEvents(runId);
  }

  async getAllEvents(runId: string) {
    const rawEvents = await this.replay.getAllEvents(runId);

    const formattedEvents: {
      eventIds: Record<RunId, EventId[]>;
      events: Record<EventId, AnyEvent>;
    } = {
      eventIds: {},
      events: {},
    };

    for (const event of rawEvents) {
      formattedEvents.events[event.id] ??= event;
      (formattedEvents.eventIds[runId] ??= []).push(event.id);
    }
    return formattedEvents;
  }
}
