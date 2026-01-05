import { describe, it, expect, vi } from "vitest";
import {
  EventBusPort,
  JobParserPort,
  QueuePort,
  StreamRegistryPort,
  ToolBinding,
  ToolInstancePort,
} from "@lcase/ports";
import { Worker } from "../src/worker.js";
import type { AnyEvent, ToolId } from "@lcase/types";
import { EmitterFactory } from "@lcase/events";
import { ToolRegistry } from "@lcase/tools";

const bus = {
  subscribe: async () => {
    return;
  },
} as unknown as EventBusPort;

describe("worker", () => {
  it("stops new waiters from starting ", async () => {
    const event = { data: { job: "job-id" } } as unknown as AnyEvent;
    const toolId = "mcp";

    const reserve = vi.fn().mockResolvedValue(event);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const newJobEmitterFromEvent = vi.fn().mockReturnValue({
      emit: (arg: string, data: unknown) => {
        console.log("emitting event");
      },
    });
    const emit = vi.fn().mockReturnValue(undefined);
    const newWorkerEmitterNewSpan = vi.fn().mockReturnValue({ emit });
    const ef = {
      newJobEmitterFromEvent,
      newWorkerEmitterNewSpan,
    } as unknown as EmitterFactory;

    const maxConcurrency = 2;
    const binding: ToolBinding = {
      spec: {
        id: toolId,
        maxConcurrency,
        capabilities: [],
        location: "internal",
        rateLimit: undefined,
      },
      create: function (): ToolInstancePort<ToolId> {
        throw new Error("Function not implemented.");
      },
      runtimePolicy: {
        preferredScope: "stateless",
        makeCacheKey: undefined,
      },
    };

    const listToolIds = vi.fn().mockReturnValue([toolId]);
    const getBinding = vi.fn().mockReturnValue(binding);
    const toolRegistry = {
      listToolIds,
      getBinding,
    } as unknown as ToolRegistry<ToolId>;

    const jobParser = vi
      .fn()
      .mockReturnValue(undefined) as unknown as JobParserPort;

    const worker = new Worker("workerId", {
      bus,
      queue,
      emitterFactory: ef,
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry,
      jobParser,
    });

    worker.requestSlot = vi.fn().mockImplementation(async () => {});
    worker.handleRateLimit = vi.fn().mockImplementation(async () => {});

    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      expect(worker.getToolActiveJobCount(toolId)).toBeLessThanOrEqual(
        maxConcurrency
      );
      return new Promise(() => {});
    });

    const p = worker.startToolJobWaiters(toolId);

    Promise.resolve();
    Promise.resolve();
    await new Promise((r) => {
      setTimeout(r, 20);
    });

    const a = new Promise((r) => {
      setTimeout(r, 20);
    });

    // expect(worker.getToolWaitersSize(toolId)).toBe(2);
    // expect(reserve).toHaveBeenCalledTimes(2);
    // expect(emit).toHaveBeenCalledTimes(2);
    // expect(worker.getToolActiveJobCount(toolId)).toBe(2);
    // expect(worker.handleNewJob).toHaveBeenCalledWith(event);
    await worker.stopAllJobWaiters();
  });
  /** 
 * Temporarily disabled until this is refactored with the limiter event driven 
 * flow in mind.
 * 
  it("stops new waiters when they are disabled", async () => {
    const event = { data: { job: "job-id" } } as unknown as AnyEvent;
    const toolId = "mcp";

    const reserve = vi.fn().mockResolvedValue(event);

    const queue = {
      reserve,
      abortAllForWorker: vi.fn(),
    } as unknown as QueuePort;

    const newJobEmitterFromEvent = vi.fn().mockReturnValue({
      emit: (arg: string, data: unknown) => {
        console.log("emitting event2");
      },
    });
    const emit = vi.fn().mockReturnValue(undefined);
    const newWorkerEmitterNewSpan = vi.fn().mockReturnValue({ emit });
    const ef = {
      newJobEmitterFromEvent,
      newWorkerEmitterNewSpan,
    } as unknown as EmitterFactory;

    const binding: ToolBinding = {
      spec: {
        id: "mcp",
        maxConcurrency: 5,
        capabilities: [],
        location: "internal",
        rateLimit: undefined,
      },
      create: function (): ToolInstancePort<ToolId> {
        throw new Error("Function not implemented.");
      },
      runtimePolicy: {
        preferredScope: "stateless",
        makeCacheKey: undefined,
      },
    };

    const listToolIds = vi.fn().mockReturnValue([toolId]);
    const getBinding = vi.fn().mockReturnValue(binding);
    const toolRegistry = {
      listToolIds,
      getBinding,
    } as unknown as ToolRegistry<ToolId>;

    const jobParser = vi
      .fn()
      .mockReturnValue(undefined) as unknown as JobParserPort;

    const worker = new Worker("workerId", {
      bus,
      queue,
      emitterFactory: ef,
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry,
      jobParser,
    });

    worker.requestSlot = vi.fn().mockImplementation(async () => {});
    worker.handleRateLimit = vi.fn().mockImplementation(async () => {});

    worker.handleNewJob = vi.fn().mockImplementation(async () => {
      queueMicrotask(() => {
        worker.setToolWaiterPolicy(toolId, false);
      });
      return;
    });

    await worker.startToolJobWaiters(toolId);

    expect(reserve).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledTimes(2);
    expect(worker.handleNewJob).toHaveBeenCalledTimes(2);
    expect(worker.getToolActiveJobCount(toolId)).toBe(0);
    expect(worker.getToolWaitersSize(toolId)).toBe(0);
    expect(worker.handleNewJob).toHaveBeenCalledWith(event);
    await worker.stopAllJobWaiters();
  });
  **/
});
