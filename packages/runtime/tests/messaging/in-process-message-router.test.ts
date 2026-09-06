import { describe, expect, it, vi } from "vitest";
import { buildEvent } from "@lcase/events";
import type { AnyEvent, EventType } from "@lcase/types";
import type {
  LogicalSubscription,
  MessageHandler,
  Publication,
} from "@lcase/ports";
import {
  definePublication,
  definePublicationFor,
} from "../../src/messaging/define-publication.js";
import {
  createInProcessMessageRouter,
  type InProcessMessageRouter,
  type InProcessMessageRouterConfig,
} from "../../src/messaging/in-process/in-process-message-router.js";

/** A deferred bind, so one array can carry bindings for different
 * publications without needing an erased binding type. */
type Bind = (router: InProcessMessageRouter) => void;

// The authoritative-union shape C10 uses: the union is named once and shared
// by the publication and every handler/publisher signature.
type HttpJobTerminalType = "job.httpjson.completed" | "job.httpjson.failed";

const terminal = definePublicationFor<HttpJobTerminalType>()({
  id: "http-job-terminal.v1",
  types: ["job.httpjson.completed", "job.httpjson.failed"],
});

// The derive-from-list shape, where the declaration owns its own contract.
const completedOnly = definePublication({
  id: "http-job-completed-only.v1",
  types: ["job.httpjson.completed"],
});

function subscription<const Types extends readonly EventType[]>(
  id: string,
  publication: Publication<Types>,
): LogicalSubscription<Types> {
  return { id, publication };
}

function jobScope(jobid: string) {
  return {
    flowid: "flow-1",
    flowversionid: "flowversion-1",
    runid: "run-1",
    stepid: "step-1",
    jobid,
    capid: "httpjson",
    toolid: "tool-1",
    source: "lowercase://worker/test",
  } as const;
}

function completedEvent(jobid = "job-1"): AnyEvent<"job.httpjson.completed"> {
  return buildEvent(
    "job.httpjson.completed",
    { status: "success", output: "hash-1" },
    jobScope(jobid),
  );
}

function failedEvent(jobid = "job-1"): AnyEvent<"job.httpjson.failed"> {
  return buildEvent(
    "job.httpjson.failed",
    { status: "failure", output: null, message: "boom" },
    jobScope(jobid),
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

function binding<const Types extends readonly EventType[]>(
  id: string,
  publication: Publication<Types>,
  handler: MessageHandler<Types[number]>,
  maxInFlight?: number,
): Bind {
  return (router) =>
    router.bind({
      subscription: subscription(id, publication),
      handler,
      maxInFlight,
    });
}

/** declare -> bind -> seal, for the majority of tests that need no publisher
 * resolved before binding. */
function sealedRouter(
  config: InProcessMessageRouterConfig & { bindings: readonly Bind[] },
): InProcessMessageRouter {
  const { bindings, ...rest } = config;
  const router = createInProcessMessageRouter(rest);
  for (const bind of bindings) bind(router);
  router.seal();
  return router;
}

describe("createInProcessMessageRouter — topology validation", () => {
  const noop: MessageHandler<EventType> = async () => {};

  it("rejects duplicate publication ids at construction", () => {
    expect(() =>
      createInProcessMessageRouter({
        publications: [terminal, { ...terminal }],
      }),
    ).toThrow(/duplicate publication id 'http-job-terminal.v1'/);
  });

  it("rejects a duplicate subscription id at bind", () => {
    const router = createInProcessMessageRouter({ publications: [terminal] });
    binding("engine.terminal.v1", terminal, noop)(router);

    expect(() => binding("engine.terminal.v1", terminal, noop)(router)).toThrow(
      /duplicate subscription id 'engine.terminal.v1'/,
    );
  });

  it("rejects a subscription referencing an undeclared publication at bind", () => {
    const router = createInProcessMessageRouter({ publications: [terminal] });

    expect(() =>
      binding("obs.command.v1", completedOnly, noop)(router),
    ).toThrow(/references undeclared publication 'http-job-completed-only.v1'/);
  });

  it("rejects a declared publication nothing subscribes to, at seal", () => {
    const router = createInProcessMessageRouter({
      publications: [terminal, completedOnly],
    });
    binding("engine.terminal.v1", terminal, noop)(router);

    expect(() => router.seal()).toThrow(
      /publication 'http-job-completed-only.v1' has no logical subscriptions/,
    );
  });

  it("rejects a publisher request for an undeclared publication", () => {
    const router = sealedRouter({
      publications: [terminal],
      bindings: [binding("engine.terminal.v1", terminal, noop)],
    });

    expect(() => router.publisher(completedOnly)).toThrow(
      /undeclared publication 'http-job-completed-only.v1'/,
    );
  });
});

describe("createInProcessMessageRouter — sealing", () => {
  const noop: MessageHandler<EventType> = async () => {};

  it("refuses to bind a new subscription after seal", () => {
    const router = sealedRouter({
      publications: [terminal],
      bindings: [binding("engine.terminal.v1", terminal, noop)],
    });

    expect(() => binding("late.terminal.v1", terminal, noop)(router)).toThrow(
      /cannot bind 'late.terminal.v1' after seal\(\)/,
    );
  });

  it("refuses to seal twice", () => {
    const router = sealedRouter({
      publications: [terminal],
      bindings: [binding("engine.terminal.v1", terminal, noop)],
    });

    expect(() => router.seal()).toThrow(/already sealed/);
  });

  it("refuses to publish before seal", async () => {
    const router = createInProcessMessageRouter({ publications: [terminal] });
    binding("engine.terminal.v1", terminal, noop)(router);

    await expect(
      router.publisher(terminal).publish(completedEvent()),
    ).rejects.toThrow(
      /cannot publish to 'http-job-terminal.v1' before seal\(\)/,
    );
  });

  it("resolves a publisher before its destinations are bound", async () => {
    const seen: string[] = [];
    const router = createInProcessMessageRouter({ publications: [terminal] });

    // Resolved first -- this is what lets a component be constructed with its
    // publisher before that component's own handler exists to bind.
    const publisher = router.publisher(terminal);

    binding("engine.terminal.v1", terminal, async (m) => {
      seen.push(m.id);
    })(router);
    router.seal();

    const published = completedEvent();
    await publisher.publish(published);
    await router.whenIdle();

    expect(seen).toEqual([published.id]);
  });
});

describe("createInProcessMessageRouter — publication", () => {
  it("resolves publish() while a recipient handler is still blocked", async () => {
    const gate = deferred();
    const started = deferred();
    const handler = vi.fn(async () => {
      started.resolve();
      await gate.promise;
    });
    const router = sealedRouter({
      publications: [terminal],
      bindings: [binding("engine.terminal.v1", terminal, handler)],
    });

    await router.publisher(terminal).publish(completedEvent());
    await started.promise;

    // publish() already resolved above while the handler is still awaiting.
    expect(handler).toHaveBeenCalledTimes(1);
    gate.resolve();
  });

  it("never invokes a handler inline during publish()", async () => {
    const handler = vi.fn(async () => {});
    const router = sealedRouter({
      publications: [terminal],
      bindings: [binding("engine.terminal.v1", terminal, handler)],
    });

    const publishing = router.publisher(terminal).publish(completedEvent());
    expect(handler).not.toHaveBeenCalled();

    await publishing;
    await router.whenIdle();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rejects a Message type the publication does not allow, before any branch receives it", async () => {
    const handler = vi.fn(async () => {});
    const router = sealedRouter({
      publications: [completedOnly],
      bindings: [binding("obs.completed.v1", completedOnly, handler)],
    });

    const publisher = router.publisher(completedOnly) as unknown as {
      publish(m: AnyEvent): Promise<void>;
    };

    await expect(publisher.publish(failedEvent())).rejects.toThrow(
      /does not allow 'job.httpjson.failed'/,
    );
    await router.whenIdle();
    expect(handler).not.toHaveBeenCalled();
  });

  it("gives every logical subscription its own independent copy", async () => {
    const engineSeen: AnyEvent[] = [];
    const obsSeen: AnyEvent[] = [];
    const router = sealedRouter({
      publications: [terminal],
      bindings: [
        binding("engine.terminal.v1", terminal, async (m) => {
          engineSeen.push(m);
        }),
        binding("obs.terminal.v1", terminal, async (m) => {
          obsSeen.push(m);
        }),
      ],
    });

    const published = completedEvent();
    await router.publisher(terminal).publish(published);
    await router.whenIdle();

    expect(engineSeen).toHaveLength(1);
    expect(obsSeen).toHaveLength(1);
    expect(engineSeen[0]?.id).toBe(published.id);
    expect(obsSeen[0]?.id).toBe(published.id);
    expect(engineSeen[0]).not.toBe(obsSeen[0]);
    expect(engineSeen[0]).not.toBe(published);
  });

  it("delivers frozen copies a recipient cannot use to affect anyone else", async () => {
    let received: AnyEvent | undefined;
    const router = sealedRouter({
      publications: [terminal],
      bindings: [
        binding("engine.terminal.v1", terminal, async (m) => {
          received = m;
        }),
      ],
    });

    const published = completedEvent();
    await router.publisher(terminal).publish(published);
    await router.whenIdle();

    expect(Object.isFrozen(received)).toBe(true);
    expect(Object.isFrozen(received?.data)).toBe(true);
    expect(() => {
      (received as { id: string }).id = "tampered";
    }).toThrow(TypeError);
    expect(published.id).not.toBe("tampered");
  });

  it("creates two deliveries when the same Message id is published twice", async () => {
    const seen: string[] = [];
    const router = sealedRouter({
      publications: [terminal],
      bindings: [
        binding("engine.terminal.v1", terminal, async (m) => {
          seen.push(m.id);
        }),
      ],
    });

    const published = completedEvent();
    const publisher = router.publisher(terminal);
    await publisher.publish(published);
    await publisher.publish(published);
    await router.whenIdle();

    expect(seen).toEqual([published.id, published.id]);
  });
});

describe("createInProcessMessageRouter — isolation", () => {
  it("does not let a blocked subscription block another", async () => {
    const blocked = deferred();
    const fast: string[] = [];
    const router = sealedRouter({
      publications: [terminal],
      bindings: [
        binding("slow.terminal.v1", terminal, async () => {
          await blocked.promise;
        }),
        binding("fast.terminal.v1", terminal, async (m) => {
          fast.push(m.id);
        }),
      ],
    });

    const published = completedEvent();
    await router.publisher(terminal).publish(published);

    await vi.waitFor(() => expect(fast).toEqual([published.id]));
    blocked.resolve();
    await router.whenIdle();
  });

  it("does not let a failing subscription affect another subscription's copy", async () => {
    const delivered: string[] = [];
    const failures: string[] = [];
    const router = sealedRouter({
      publications: [terminal],
      bindings: [
        binding("failing.terminal.v1", terminal, async () => {
          throw new Error("sink exploded");
        }),
        binding("healthy.terminal.v1", terminal, async (m) => {
          delivered.push(m.id);
        }),
      ],
      reportFailure: (failure) => failures.push(failure.subscriptionId),
    });

    const published = completedEvent();
    await router.publisher(terminal).publish(published);
    await router.whenIdle();

    expect(delivered).toEqual([published.id]);
    expect(failures).toEqual(["failing.terminal.v1"]);
  });
});

describe("createInProcessMessageRouter — whenIdle", () => {
  it("resolves immediately when nothing is outstanding", async () => {
    const router = sealedRouter({
      publications: [terminal],
      bindings: [binding("engine.terminal.v1", terminal, async () => {})],
    });

    await expect(router.whenIdle()).resolves.toBeUndefined();
  });

  it("waits for a publication caused by a handler mid-flight", async () => {
    const downstream: string[] = [];
    const followUp = completedEvent("job-2");

    // The multi-hop shape C10 actually uses: the second publisher is resolved
    // before the handler that needs it exists, so no mutable late assignment
    // is required to close the cycle.
    const router = createInProcessMessageRouter({
      publications: [terminal, completedOnly],
    });
    const secondPublisher = router.publisher(completedOnly);

    binding("worker.terminal.v1", terminal, async () => {
      await secondPublisher.publish(followUp);
    })(router);
    binding("engine.completed.v1", completedOnly, async (m) => {
      downstream.push(m.id);
    })(router);
    router.seal();

    await router.publisher(terminal).publish(completedEvent("job-1"));
    await router.whenIdle();

    expect(downstream).toEqual([followUp.id]);
  });

  it("resolves after a failed attempt has been reported", async () => {
    const router = sealedRouter({
      publications: [terminal],
      bindings: [
        binding("failing.terminal.v1", terminal, async () => {
          throw new Error("sink exploded");
        }),
      ],
      reportFailure: () => {},
    });

    await router.publisher(terminal).publish(completedEvent());
    await expect(router.whenIdle()).resolves.toBeUndefined();
  });
});
