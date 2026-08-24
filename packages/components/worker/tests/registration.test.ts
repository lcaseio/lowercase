import { describe, it, expect, vi } from "vitest";
import {
  ArtifactsPort,
  EventBusPort,
  JobParserPort,
  QueuePort,
  StreamRegistryPort,
  ToolBinding,
  ToolInstancePort,
} from "@lcase/ports";
import { Worker } from "../src/worker.js";
import type { ToolId } from "@lcase/types";
import { EmitterFactory } from "@lcase/events";
import { ToolRegistry } from "@lcase/tools";

const bus = {
  publish: async () => {},
  subscribe: async () => {},
} as unknown as EventBusPort;

/**
 * this is more of an integration tests, using the event emitter to actually
 * be called, it does not isolate the shape of the emitted object, so
 * this should be moved to a unit test form later.
 *
 * just a simple check for now that the event will parse a zod schema in
 * the event emitter;
 */
describe("worker register event payload", () => {
  it("emits a valid request registration payload", async () => {
    const toolId = "mcp";
    const queue = {} as unknown as QueuePort;

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
    const jobParser = vi
      .fn()
      .mockReturnValue(undefined) as unknown as JobParserPort;

    const toolRegistry = {
      listToolIds,
      getBinding,
    } as unknown as ToolRegistry<ToolId>;

    const worker = new Worker("workerId", {
      bus,
      queue,
      emitterFactory: new EmitterFactory(bus),
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry,
      jobParser,
      artifacts: {} as ArtifactsPort,
    });
    await expect(worker.requestRegistration()).resolves.not.toThrow();
  });
  it("emits an invalid request registration payload with unknown tool", async () => {
    const toolId = "unknown-tool-id";
    const queue = {} as unknown as QueuePort;

    const binding: ToolBinding = {
      spec: {
        id: toolId as ToolId,
        maxConcurrency: 0,
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
      emitterFactory: new EmitterFactory(bus),
      streamRegistry: {} as StreamRegistryPort,
      toolRegistry,
      jobParser,
      artifacts: {} as ArtifactsPort,
    });
    await expect(worker.requestRegistration()).rejects.toThrow();
  });
});
