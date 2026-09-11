import { buildEvent } from "@lcase/events";
import { RedisMessageLog } from "@lcase/adapters/message-log";
import type { AnyEvent } from "@lcase/types";
import { createClient, type RedisClientType } from "redis";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHttpJobGraph } from "./helpers/http-job-graph.js";
import { createRedisMessageRouter } from "@lcase/message-router";
import {
  httpJobPublications,
  httpJobSubscriptions,
} from "../src/http-job.topology.js";

// Real integration test against a live Redis instance -- gated on
// REDIS_TEST_URL, since the claim being made here is that consumer-group
// delivery carries the same conversation an in-process mailbox does, and a
// fake cannot establish that. Run `docker compose up -d redis` and copy
// .env.test.local.example to .env.test.local (loaded automatically, see
// tests/setup-env.ts) to exercise this locally; CI provides the var directly
// via the workflow's redis service.
//
// The point of the test is what it does *not* change: it hands
// buildHttpJobGraph a different carrier and asserts the same things
// http-job.slice.test.ts asserts in-process. Engine, Worker and Observability
// are constructed identically and know nothing about either.
const url = process.env.REDIS_TEST_URL;

function submitted(): AnyEvent<"job.httpjson.submitted"> {
  return buildEvent(
    "job.httpjson.submitted",
    { url: "https://example.test/greet", refs: [] },
    {
      flowid: "flow-1",
      flowversionid: "flowversion-1",
      runid: "run-1",
      stepid: "step-1",
      jobid: "job-1",
      capid: "httpjson",
      toolid: "httpjson",
      source: "lowercase://engine",
    },
  );
}

describe.skipIf(!url)("HTTP JSON job vertical slice (real Redis)", () => {
  const started: { stop: () => Promise<void> }[] = [];
  const clients: RedisClientType[] = [];

  afterEach(async () => {
    for (const router of started.splice(0)) await router.stop();
    for (const client of clients.splice(0)) {
      if (client.isOpen) await client.quit();
    }
  });

  // A fresh prefix per test, so streams and groups never carry state between
  // runs. Nothing in Redis is worth preserving here.
  function redisRouter() {
    const keyPrefix = `lcase-test:${Date.now()}-${Math.random().toString(36).slice(2)}:`;
    const router = createRedisMessageRouter({
      publications: httpJobPublications,
      subscriptions: httpJobSubscriptions,
      createLog: async () => {
        const client: RedisClientType = createClient({ url });
        await client.connect();
        clients.push(client);
        return new RedisMessageLog(client);
      },
      keyPrefix,
      blockMs: 50,
    });
    return { router, keyPrefix };
  }

  it("carries a completion through Redis Streams: worker executes once, engine advances from the terminal", async () => {
    const { router } = redisRouter();
    // buildHttpJobGraph binds all four subscriptions and seals; start() is
    // the only step the log-backed carrier adds.
    const graph = buildHttpJobGraph({ router });
    await router.start();
    started.push(router);

    const command = submitted();
    await graph.httpJobCommands.publish(command);

    await vi.waitFor(() => expect(graph.enqueued).toHaveLength(1), {
      timeout: 5_000,
    });

    expect(graph.fetchSpy).toHaveBeenCalledTimes(1);
    expect(graph.enqueued[0]).toMatchObject({
      type: "JobFinished",
      event: {
        type: "job.httpjson.completed",
        jobid: "job-1",
        runid: "run-1",
        stepid: "step-1",
        traceid: command.traceid,
        source: "lowercase://worker",
      },
    });

    // Observability holds its own consumer group on each stream, so it sees
    // the command and the terminal independently -- the same shape the
    // in-process carrier produces from two independent mailboxes.
    await vi.waitFor(() => expect(graph.observed).toHaveLength(2), {
      timeout: 5_000,
    });
    expect(graph.observed.map((e) => e.type).sort()).toEqual([
      "job.httpjson.completed",
      "job.httpjson.submitted",
    ]);

    // Not one of the migrated types touched the bus, over this carrier either.
    expect(graph.bus.publish).not.toHaveBeenCalled();
  });

  it("carries a failure the same way, and leaves nothing pending", async () => {
    const { router, keyPrefix } = redisRouter();
    const graph = buildHttpJobGraph({
      router,
      respond: () => new Response("nope", { status: 500 }),
    });
    await router.start();
    started.push(router);

    await graph.httpJobCommands.publish(submitted());

    await vi.waitFor(() => expect(graph.enqueued).toHaveLength(1), {
      timeout: 5_000,
    });
    expect(graph.enqueued[0]).toMatchObject({
      type: "JobFinished",
      event: { type: "job.httpjson.failed" },
    });

    // Every entry is acknowledged once its handler settles, so a failed job
    // leaves no pending backlog behind -- which is what makes "no reclaim"
    // a coherent position rather than a leak.
    const client: RedisClientType = createClient({ url });
    await client.connect();
    clients.push(client);
    await vi.waitFor(
      async () => {
        for (const [stream, group] of [
          [`${keyPrefix}http-job-command.v1`, "worker.http-job-command.v1"],
          [`${keyPrefix}http-job-terminal.v1`, "engine.http-job-terminal.v1"],
        ]) {
          const pending = await client.xPending(stream, group);
          expect(pending.pending).toBe(0);
        }
      },
      { timeout: 5_000 },
    );
  });
});
