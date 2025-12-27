import { WorkerEvent } from "@lcase/types";
import { describe, it, expect } from "vitest";
import {
  EmitWorkerProfileAddedFx,
  WorkerProfileSubmittedMsg,
} from "../../src/rm.types";
import type { RmState } from "../../src/rm.state.type.js";
import { workerProfileSubmittedPlanner } from "../../src/planners/worker-profie-submitted.planner";

describe("workerProfileSubmittedPlanner", () => {
  it("produces the correct plan when a new worker is registered", () => {
    const workerId = "test-workerid-new";
    const toolId = "httpjson";
    const message = {
      type: "WorkerProfileSubmitted",
      event: {
        id: "",
        source: "",
        specversion: "1.0",
        time: "",
        type: "worker.profile.submitted",
        data: {
          id: workerId,
          name: "test-workername",
          tools: [toolId],
          type: "internal",
        },
        domain: "worker",
        action: "submitted",
        traceparent: "test-traceparent",
        traceid: "test-traceid",
        spanid: "test-spanid",
        workerid: workerId,
      } satisfies WorkerEvent<"worker.profile.submitted">,
    } satisfies WorkerProfileSubmittedMsg;

    const oldState: RmState = {
      policy: {
        defaultToolMap: {
          httpjson: "httpjson",
          mcp: "mcp",
        },
      },
      registry: {
        tools: {
          [toolId]: {
            id: toolId,
            capabilities: ["httpjson"],
            hasOnlineWorker: true,
            location: "internal",
            maxConcurrency: 2,
          },
        },
        workers: {
          oldWorker: {
            canRunTools: {
              [toolId]: true,
            },
            name: "worker-name",
            type: "internal",
            status: "online",
          },
        },
      },
      runtime: {
        perTool: {
          [toolId]: {
            activeJobCount: 0,
            delayed: {},
            pendingDelayed: {},
            pendingDelayedCount: 0,
            pendingQueued: {},
            pendingQueuedCount: 1,
            queued: {},
            running: {},
          },
        },
        perRun: {},
      },
    };

    const newState = structuredClone(oldState);

    newState.registry.workers[workerId] = {
      canRunTools: { [toolId]: true },
      name: message.event.data.name,
      status: "online",
      type: message.event.data.type,
    };
    newState.registry.tools[toolId].hasOnlineWorker = true;

    const expectedEffects = [
      {
        type: "EmitWorkerProfileAdded",
        data: {
          status: "accepted",
          ok: true,
        },
        scope: {
          workerid: message.event.data.id,
          source: "lowercase://rm",
        },
        traceId: message.event.traceid,
      } satisfies EmitWorkerProfileAddedFx,
    ];

    const effects = workerProfileSubmittedPlanner(oldState, newState, message);
    expect(effects).toEqual(expectedEffects);
  });
});
