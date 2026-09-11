import { describe, expect, it, vi } from "vitest";
import { buildEvent } from "@lcase/events";
import type { AnyEvent } from "@lcase/types";
import {
  SubscriptionMailbox,
  type DeliveredMessage,
  type DeliveryFailure,
  type SubscriptionMailboxDeps,
} from "../src/in-process/subscription-mailbox.js";

function completedEvent(output: string): AnyEvent<"job.httpjson.completed"> {
  return buildEvent(
    "job.httpjson.completed",
    { status: "success", output },
    {
      flowid: "flow-1",
      flowversionid: "flowversion-1",
      runid: "run-1",
      stepid: "step-1",
      jobid: `job-${output}`,
      capid: "httpjson",
      toolid: "tool-1",
      source: "lowercase://worker/test",
    },
  );
}

function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function makeMailbox(overrides: Partial<SubscriptionMailboxDeps> = {}): {
  mailbox: SubscriptionMailbox;
  deps: SubscriptionMailboxDeps;
} {
  const deps: SubscriptionMailboxDeps = {
    subscriptionId: "test.subscription.v1",
    invoke: async () => {},
    maxInFlight: 1,
    reportFailure: () => {},
    onSettled: () => {},
    ...overrides,
  };
  return { mailbox: new SubscriptionMailbox(deps), deps };
}

describe("SubscriptionMailbox", () => {
  it("never invokes its handler inside the enqueue call stack", () => {
    const invoke = vi.fn(async () => {});
    const { mailbox } = makeMailbox({ invoke });

    mailbox.enqueue(completedEvent("a"));

    expect(invoke).not.toHaveBeenCalled();
  });

  it("processes FIFO with exactly one active handler at maxInFlight 1", async () => {
    const started: string[] = [];
    const gate = deferred();
    const invoke = vi.fn(async (message: DeliveredMessage) => {
      started.push(message.id);
      await gate.promise;
    });
    const { mailbox } = makeMailbox({ invoke, maxInFlight: 1 });

    const first = completedEvent("a");
    const second = completedEvent("b");
    const third = completedEvent("c");
    mailbox.enqueue(first);
    mailbox.enqueue(second);
    mailbox.enqueue(third);

    await vi.waitFor(() => expect(started).toHaveLength(1));
    expect(started).toEqual([first.id]);

    gate.resolve();
    await vi.waitFor(() => expect(started).toHaveLength(3));
    expect(started).toEqual([first.id, second.id, third.id]);
  });

  it("runs up to maxInFlight handlers concurrently and no more", async () => {
    let active = 0;
    let peak = 0;
    const gate = deferred();
    const invoke = vi.fn(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await gate.promise;
      active -= 1;
    });
    const { mailbox } = makeMailbox({ invoke, maxInFlight: 3 });

    for (const id of ["a", "b", "c", "d", "e"]) {
      mailbox.enqueue(completedEvent(id));
    }

    await vi.waitFor(() => expect(active).toBe(3));
    expect(peak).toBe(3);

    gate.resolve();
    await vi.waitFor(() => expect(invoke).toHaveBeenCalledTimes(5));
    expect(peak).toBe(3);
  });

  it("reports a failed delivery with identity only, then continues", async () => {
    const failures: DeliveryFailure[] = [];
    const failing = completedEvent("a");
    const invoke = vi.fn(async (message: DeliveredMessage) => {
      if (message.id === failing.id) throw new Error("handler exploded");
    });
    const { mailbox } = makeMailbox({
      invoke,
      reportFailure: (failure) => failures.push(failure),
    });

    mailbox.enqueue(failing);
    const next = completedEvent("b");
    mailbox.enqueue(next);

    await vi.waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      subscriptionId: "test.subscription.v1",
      messageId: failing.id,
      messageType: "job.httpjson.completed",
      source: "lowercase://worker/test",
    });
    // Identity only -- a Message body can carry caller-supplied input.
    expect(failures[0]).not.toHaveProperty("data");
    expect(invoke).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: next.id }),
    );
  });

  it("does not retry a failed delivery", async () => {
    const invoke = vi.fn(async () => {
      throw new Error("always fails");
    });
    const { mailbox } = makeMailbox({ invoke });

    mailbox.enqueue(completedEvent("a"));

    await vi.waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("keeps processing when the failure reporter itself throws", async () => {
    const failing = completedEvent("a");
    const invoke = vi.fn(async (message: DeliveredMessage) => {
      if (message.id === failing.id) throw new Error("handler exploded");
    });
    const { mailbox } = makeMailbox({
      invoke,
      reportFailure: () => {
        throw new Error("reporter exploded");
      },
    });

    mailbox.enqueue(failing);
    mailbox.enqueue(completedEvent("b"));

    await vi.waitFor(() => expect(invoke).toHaveBeenCalledTimes(2));
  });

  it("settles the router bookkeeping for both success and failure", async () => {
    const onSettled = vi.fn();
    const failing = completedEvent("a");
    const invoke = vi.fn(async (message: DeliveredMessage) => {
      if (message.id === failing.id) throw new Error("handler exploded");
    });
    const { mailbox } = makeMailbox({ invoke, onSettled });

    mailbox.enqueue(failing);
    mailbox.enqueue(completedEvent("b"));

    await vi.waitFor(() => expect(onSettled).toHaveBeenCalledTimes(2));
  });
});
