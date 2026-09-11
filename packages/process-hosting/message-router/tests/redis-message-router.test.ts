import { describe, expect, it, vi } from "vitest";
import { buildEvent } from "@lcase/events";
import type { AnyEvent } from "@lcase/types";
import type { LogicalSubscription } from "@lcase/ports";
import { definePublicationFor } from "../src/define-publication.js";
import { createRedisMessageRouter } from "../src/redis/redis-message-router.js";
import type { DeliveryFailure } from "../src/delivery.types.js";
import { createFakeMessageLogStore } from "./helpers/fake-message-log.js";

type TerminalType = "job.httpjson.completed" | "job.httpjson.failed";

const terminal = definePublicationFor<TerminalType>()({
  id: "http-job-terminal.v1",
  types: ["job.httpjson.completed", "job.httpjson.failed"],
});

const engineTerminal: LogicalSubscription<typeof terminal.types> = {
  id: "engine.http-job-terminal.v1",
  publication: terminal,
};

const obsTerminal: LogicalSubscription<typeof terminal.types> = {
  id: "observability.http-job-terminal.v1",
  publication: terminal,
};

const STREAM = "test:http-job-terminal.v1";

function completedEvent(jobid = "job-1"): AnyEvent<"job.httpjson.completed"> {
  return buildEvent(
    "job.httpjson.completed",
    { status: "success", output: "hash-1" },
    {
      flowid: "flow-1",
      flowversionid: "flowversion-1",
      runid: "run-1",
      stepid: "step-1",
      jobid,
      capid: "httpjson",
      toolid: "tool-1",
      source: "lowercase://worker/test",
    },
  );
}

type Options = {
  handler?: (message: AnyEvent) => Promise<void>;
  maxInFlight?: number;
  subscriptions?: readonly LogicalSubscription[];
};

function setup(options: Options = {}) {
  const store = createFakeMessageLogStore();
  const failures: DeliveryFailure[] = [];
  const seen: AnyEvent[] = [];

  const router = createRedisMessageRouter({
    publications: [terminal],
    subscriptions: options.subscriptions ?? [engineTerminal],
    createLog: store.createLog,
    keyPrefix: "test:",
    blockMs: 5,
    reportFailure: (failure) => failures.push(failure),
  });

  const bind = () =>
    router.bind({
      subscription: engineTerminal,
      handler:
        options.handler ??
        (async (message) => {
          seen.push(message);
        }),
      ...(options.maxInFlight !== undefined
        ? { maxInFlight: options.maxInFlight }
        : {}),
    });

  return { store, router, failures, seen, bind };
}

async function sealedAndStarted(options: Options = {}) {
  const ctx = setup(options);
  ctx.bind();
  ctx.router.seal();
  await ctx.router.start();
  return ctx;
}

describe("createRedisMessageRouter — topology", () => {
  const noop = async (): Promise<void> => {};

  it("refuses to seal with a declared subscription nobody bound", async () => {
    // Both declared, only the engine one bound by sealedAndStarted.
    const ctx = await sealedAndStarted({
      subscriptions: [engineTerminal, obsTerminal],
    }).catch((e: unknown) => e);

    expect(ctx).toBeInstanceOf(Error);
    expect((ctx as Error).message).toMatch(
      /subscription 'observability.http-job-terminal.v1' was declared but never bound/,
    );
  });

  it("names the stream from the publication id and the group from the subscription id", async () => {
    const { store, router } = await sealedAndStarted();

    expect(store.provisionedStreams).toEqual([STREAM]);
    expect(store.provisionedGroups).toEqual([
      `${STREAM}|engine.http-job-terminal.v1`,
    ]);

    await router.stop();
  });

  it("opens a connection for publishing plus one per read loop", async () => {
    const { store, router } = await sealedAndStarted();

    expect(store.logCount).toBe(2);

    await router.stop();
    expect(store.closed).toHaveLength(2);
  });

  it("refuses to bind a subscription the topology never declared", () => {
    const { router } = setup();

    expect(() =>
      router.bind({
        subscription: { id: "undeclared.v1", publication: terminal },
        handler: noop,
      }),
    ).toThrow(/subscription 'undeclared.v1' was not declared in this topology/);
  });

  it("refuses to bind after seal, and to seal twice", () => {
    const { router, bind } = setup();
    bind();
    router.seal();

    expect(() =>
      router.bind({ subscription: engineTerminal, handler: noop }),
    ).toThrow(/cannot bind 'engine.http-job-terminal.v1' after seal\(\)/);
    expect(() => router.seal()).toThrow(/already sealed/);
  });

  it("refuses to publish before seal, and before start", async () => {
    const { router, bind } = setup();
    const publisher = router.publisher(terminal);

    await expect(publisher.publish(completedEvent())).rejects.toThrow(
      /before seal\(\)/,
    );

    bind();
    router.seal();

    // Sealed but not started: there is no connection yet, so this cannot
    // silently reach nobody the way an in-process publish never could.
    await expect(publisher.publish(completedEvent())).rejects.toThrow(
      /before start\(\)/,
    );
  });

  it("refuses a Message type its publication does not declare", async () => {
    const { router } = await sealedAndStarted();
    const publisher = router.publisher(terminal) as unknown as {
      publish(m: AnyEvent): Promise<void>;
    };

    await expect(
      publisher.publish({ ...completedEvent(), type: "run.completed" }),
    ).rejects.toThrow(/does not allow 'run.completed'/);

    await router.stop();
  });
});

describe("createRedisMessageRouter — delivery", () => {
  it("delivers a published Message to its subscription's handler and acknowledges it", async () => {
    const { router, store, seen } = await sealedAndStarted();
    const published = completedEvent();

    await router.publisher(terminal).publish(published);
    await vi.waitFor(() => expect(seen).toHaveLength(1));

    expect(seen[0]).toEqual(published);
    await vi.waitFor(() =>
      expect(store.pendingFor(STREAM, engineTerminal.id)).toEqual([]),
    );

    await router.stop();
  });

  // The whole reason acknowledgement is unconditional: a failed handler is
  // reported and dropped, exactly as the in-process mailbox already does. If
  // failures were left pending they would accumulate forever with nothing
  // reclaiming them, which looks like durability without being any.
  it("acknowledges a Message whose handler threw, after reporting it", async () => {
    const { router, store, failures } = await sealedAndStarted({
      handler: async () => {
        throw new Error("sink exploded");
      },
    });

    await router.publisher(terminal).publish(completedEvent());
    await vi.waitFor(() => expect(failures).toHaveLength(1));

    expect(failures[0]?.subscriptionId).toBe(engineTerminal.id);
    expect(failures[0]?.messageType).toBe("job.httpjson.completed");
    await vi.waitFor(() =>
      expect(store.pendingFor(STREAM, engineTerminal.id)).toEqual([]),
    );

    await router.stop();
  });

  // Nothing validated the envelope on the way in, so the reader has to
  // re-establish what publish() guarantees locally -- otherwise the cast onto
  // the handler's parameter type is unfounded.
  it("reports and acknowledges an entry whose type the publication does not declare, without invoking the handler", async () => {
    const { router, store, failures, seen } = await sealedAndStarted();

    store.inject(STREAM, { ...completedEvent(), type: "run.completed" });
    await vi.waitFor(() => expect(failures).toHaveLength(1));

    expect(seen).toEqual([]);
    expect(failures[0]?.error).toBeInstanceOf(Error);
    expect((failures[0]?.error as Error).message).toMatch(/does not declare/);
    await vi.waitFor(() =>
      expect(store.pendingFor(STREAM, engineTerminal.id)).toEqual([]),
    );

    await router.stop();
  });

  it("survives a malformed payload rather than taking its read loop down", async () => {
    const { router, store, failures, seen } = await sealedAndStarted();

    store.inject(STREAM, null);
    await vi.waitFor(() => expect(failures).toHaveLength(1));

    // The loop is still running: a real Message published afterwards arrives.
    const published = completedEvent("job-2");
    await router.publisher(terminal).publish(published);
    await vi.waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]?.id).toBe(published.id);

    await router.stop();
  });

  it("bounds concurrent handler invocations by maxInFlight", async () => {
    let inFlight = 0;
    let peak = 0;
    const release: (() => void)[] = [];

    const { router } = await sealedAndStarted({
      maxInFlight: 2,
      handler: async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise<void>((resolve) => release.push(resolve));
        inFlight -= 1;
      },
    });

    const publisher = router.publisher(terminal);
    for (let i = 0; i < 6; i++)
      await publisher.publish(completedEvent(`j${i}`));

    await vi.waitFor(() => expect(release).toHaveLength(2));
    expect(peak).toBe(2);

    // Drain, so stop() is not waiting on handlers that never resolve.
    for (let i = 0; i < 20 && release.length > 0; i++) {
      release.splice(0).forEach((r) => r());
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    await router.stop();
  });

  it("stops the read loops and closes every connection", async () => {
    const { router, store, seen } = await sealedAndStarted();

    await router.publisher(terminal).publish(completedEvent());
    await vi.waitFor(() => expect(seen).toHaveLength(1));

    await router.stop();
    expect(store.closed).toHaveLength(2);

    // Nothing is delivered after stop, and publishing has no connection left.
    store.inject(STREAM, completedEvent("job-after-stop"));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(seen).toHaveLength(1);
    await expect(
      router.publisher(terminal).publish(completedEvent()),
    ).rejects.toThrow(/before start\(\)/);
  });
});
