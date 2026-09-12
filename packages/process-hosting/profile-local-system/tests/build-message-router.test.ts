import { describe, expect, it } from "vitest";
import { buildMessageRouter } from "../src/build-message-router.js";
import {
  httpJobTopics,
  httpJobSubscriptions,
} from "../src/http-job.topology.js";

const topology = {
  topics: httpJobTopics,
  subscriptions: httpJobSubscriptions,
};

describe("buildMessageRouter", () => {
  // Both carriers satisfy MessageRouter structurally, so the branch is told
  // apart by what actually differs: whether there is anything to start.
  it("returns a router with no lifecycle for an in-process config", () => {
    const { router, hooks } = buildMessageRouter(
      { kind: "in-process" },
      topology,
    );

    expect(router.seal).toBeInstanceOf(Function);
    expect(hooks.start).toBeUndefined();
    expect(hooks.stop).toBeUndefined();
  });

  it("returns a router with start/stop hooks for a redis-streams config", () => {
    const { router, hooks } = buildMessageRouter(
      { kind: "redis-streams", url: "redis://localhost:6379" },
      topology,
    );

    expect(router.seal).toBeInstanceOf(Function);
    expect(hooks.start).toBeInstanceOf(Function);
    expect(hooks.stop).toBeInstanceOf(Function);
  });

  // Construction must not connect: the profile builds the router
  // synchronously, and connecting is start()'s job.
  it("does not connect to Redis while constructing", () => {
    expect(() =>
      buildMessageRouter(
        { kind: "redis-streams", url: "redis://127.0.0.1:1" },
        topology,
      ),
    ).not.toThrow();
  });
});
