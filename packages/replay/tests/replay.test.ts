import { describe, it, expect, vi } from "vitest";
import { ReplayEngine } from "../src/replay.js";
import { EventStorePort } from "@lcase/ports/event-store";
import { EventBusPort } from "@lcase/ports";

describe("replay engine", () => {
  it("should read and emit all events", async () => {
    const eventOne = { runId: "run-123", type: "event-type" };
    const eventTwo = { runId: "run-456", type: "event-type" };

    async function* mockAsyncGenerator(): AsyncGenerator<
      Record<string, string>
    > {
      yield eventOne;
      yield eventTwo;
    }

    const iterateAllEvents = vi.fn(() => mockAsyncGenerator());
    const store = {
      iterateAllEvents,
    } as unknown as EventStorePort;

    const publish = vi.fn(() => {});

    const bus = {
      publish,
    } as unknown as EventBusPort;

    const replay = new ReplayEngine(store, bus);
    await replay.replayAllEvents("run-123");

    expect(publish).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenNthCalledWith(1, eventOne.type, eventOne);
    expect(publish).toHaveBeenNthCalledWith(2, eventTwo.type, eventTwo);
  });
});
