// import { describe, it, expect, vi } from "vitest";
// import {
//   ConcurrencyLimiter,
//   ToolQueueEntry,
// } from "../src/concurrency-limiter.js";
// import type { EmitterFactoryPort, EventBusPort } from "@lcase/ports";
// import { AnyEvent } from "@lcase/types";

// describe("handleToolRequested", () => {
//   it("invokes emitGranted() when a tool has a slot available", async () => {
//     const bus = vi.fn().mockReturnValue({}) as unknown as EventBusPort;
//     const ef = {} as unknown as EmitterFactoryPort;

//     const cl = new ConcurrencyLimiter(bus, ef, "test-concurrencyid");

//     cl.toolCounters = {
//       "test-toolid": { count: 0, limit: 1 },
//     };
//     const event = {
//       id: "",
//       source: "",
//       specversion: "1.0",
//       time: "",
//       type: "scheduler.slot.requested",
//       data: {
//         runId: "test-runid",
//         toolId: "test-toolid",
//         jobId: "test-jobid",
//       },
//       domain: "scheduler",
//       action: "requested",
//       traceparent: "",
//       traceid: "",
//       spanid: "",
//       schedulerid: "test-schedulerid",
//     } satisfies AnyEvent<"scheduler.slot.requested">;

//     const emitGranted = vi.spyOn(cl, "emitGranted").mockResolvedValue();
//     await cl.handleToolRequested(event);

//     expect(emitGranted).toHaveBeenCalledExactlyOnceWith(event);
//   });
//   it("invokes emitDenied() when a tool has no slot available", async () => {
//     const bus = vi.fn().mockReturnValue({}) as unknown as EventBusPort;
//     const ef = {} as unknown as EmitterFactoryPort;

//     const cl = new ConcurrencyLimiter(bus, ef, "test-concurrencyid");

//     cl.toolCounters = {
//       "test-toolid": { count: 0, limit: 0 },
//     };
//     cl.toolQueues["test-toolid"] = [];
//     const expectedToolQueue = {
//       schedulerId: "test-schedulerid",
//       runId: "test-runid",
//       jobId: "test-jobid",
//     } satisfies ToolQueueEntry;
//     const event = {
//       id: "",
//       source: "",
//       specversion: "1.0",
//       time: "",
//       type: "scheduler.slot.requested",
//       data: {
//         runId: "test-runid",
//         toolId: "test-toolid",
//         jobId: "test-jobid",
//       },
//       domain: "scheduler",
//       action: "requested",
//       traceparent: "",
//       traceid: "",
//       spanid: "",
//       schedulerid: "test-schedulerid",
//     } satisfies AnyEvent<"scheduler.slot.requested">;

//     const emitDenied = vi.spyOn(cl, "emitDenied").mockResolvedValue();
//     await cl.handleToolRequested(event);

//     expect(emitDenied).toHaveBeenCalledExactlyOnceWith(event);
//     expect(cl.toolQueues["test-toolid"]).toEqual([expectedToolQueue]);
//   });
// });
