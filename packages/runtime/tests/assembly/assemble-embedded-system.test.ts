import { describe, expect, it } from "vitest";
import type { ManagedResource } from "../../src/assembly/managed-resource.js";
import {
  assembleEmbeddedSystem,
  type EmbeddedSystemAssemblyInput,
} from "../../src/assembly/assemble-embedded-system.js";

function testResource(
  id: string,
  callOrder: string[],
  opts: { failStart?: boolean; unhealthy?: string } = {},
): ManagedResource<unknown> {
  return {
    id,
    instance: undefined,
    async start() {
      if (opts.failStart) throw new Error(`${id} failed to start`);
      callOrder.push(`start:${id}`);
    },
    async stop() {
      callOrder.push(`stop:${id}`);
    },
    async health() {
      return opts.unhealthy
        ? { status: "unhealthy" as const, reason: opts.unhealthy }
        : { status: "healthy" as const };
    },
  };
}

function testInput(
  callOrder: string[],
  overrides: Partial<
    Record<keyof EmbeddedSystemAssemblyInput, ManagedResource<unknown>>
  > = {},
): EmbeddedSystemAssemblyInput {
  return {
    bus: overrides.bus ?? testResource("bus", callOrder),
    sinks: [testResource("sink1", callOrder), testResource("sink2", callOrder)],
    tap: overrides.tap ?? testResource("tap", callOrder),
    engine: overrides.engine ?? testResource("engine", callOrder),
    limiter: overrides.limiter ?? testResource("limiter", callOrder),
  };
}

describe("assembleEmbeddedSystem", () => {
  it("starts resources in fixed order: bus, sinks, tap, engine, limiter", async () => {
    const callOrder: string[] = [];
    const runtime = assembleEmbeddedSystem(testInput(callOrder));

    await runtime.start();

    expect(callOrder).toEqual([
      "start:bus",
      "start:sink1",
      "start:sink2",
      "start:tap",
      "start:engine",
      "start:limiter",
    ]);
  });

  it("stops resources in exact reverse order", async () => {
    const callOrder: string[] = [];
    const runtime = assembleEmbeddedSystem(testInput(callOrder));

    await runtime.start();
    callOrder.length = 0;
    await runtime.stop();

    expect(callOrder).toEqual([
      "stop:limiter",
      "stop:engine",
      "stop:tap",
      "stop:sink2",
      "stop:sink1",
      "stop:bus",
    ]);
  });

  it("rolls back at the assembled-runtime level when a resource fails to start", async () => {
    const callOrder: string[] = [];
    const input = testInput(callOrder, {
      engine: testResource("engine", callOrder, { failStart: true }),
    });
    const runtime = assembleEmbeddedSystem(input);

    const outcome = await runtime.start();

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(outcome.failedResourceId).toBe("engine");
    // Everything started before `engine` gets rolled back; `limiter` never starts.
    expect(callOrder).toEqual([
      "start:bus",
      "start:sink1",
      "start:sink2",
      "start:tap",
      "stop:tap",
      "stop:sink2",
      "stop:sink1",
      "stop:bus",
    ]);
  });

  it("returns a defined failure rather than double-starting on a second start() call", async () => {
    const callOrder: string[] = [];
    const runtime = assembleEmbeddedSystem(testInput(callOrder));

    await runtime.start();
    const secondOutcome = await runtime.start();

    expect(secondOutcome.ok).toBe(false);
    if (secondOutcome.ok) throw new Error("expected failure");
    expect(secondOutcome.error).toBe("already running");
    // No resource's start() was invoked a second time.
    expect(callOrder.filter((c) => c === "start:bus")).toHaveLength(1);
  });

  it("aggregates health across all resources", async () => {
    const callOrder: string[] = [];
    const healthyInput = testInput(callOrder);
    const healthyRuntime = assembleEmbeddedSystem(healthyInput);
    await expect(healthyRuntime.health()).resolves.toMatchObject({
      status: "healthy",
    });

    const unhealthyInput = testInput(callOrder, {
      tap: testResource("tap", callOrder, { unhealthy: "disconnected" }),
    });
    const unhealthyRuntime = assembleEmbeddedSystem(unhealthyInput);
    const report = await unhealthyRuntime.health();

    expect(report.status).toBe("unhealthy");
    expect(report.resources).toContainEqual({
      id: "tap",
      health: { status: "unhealthy", reason: "disconnected" },
    });
  });

  it("throws synchronously on duplicate resource ids, before start() is ever called", () => {
    const callOrder: string[] = [];
    const input = testInput(callOrder, {
      tap: testResource("engine", callOrder), // collides with the `engine` field's id
    });

    expect(() => assembleEmbeddedSystem(input)).toThrow(
      /duplicate managed resource id/,
    );
    expect(callOrder).toEqual([]);
  });
});
