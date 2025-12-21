import { describe, it, expect } from "vitest";
import { WorkerProfileSubmittedMsg } from "../../src/rm.types.js";
import { WorkerEvent } from "@lcase/types";
import { RmState } from "../../src/resource-manager.js";
import { workerProfileSubmittedReducer } from "../../src/reducers/worker-profile-submitted.reducer.js";

describe("workerRegistrationRequestedReducer", () => {
  it("gives expected results", () => {
    const workerId = "test-workerid";
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

    const state = {
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
          [workerId]: {
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
        perTool: {},
        perRun: {},
      },
    } satisfies RmState;

    const expectedState = structuredClone(state);

    expectedState.registry.workers[workerId] = {
      canRunTools: { [toolId]: true },
      name: message.event.data.name,
      status: "online",
      type: message.event.data.type,
    };
    expectedState.registry.tools[toolId].hasOnlineWorker = true;

    const newState = workerProfileSubmittedReducer(state, message);
    expect(newState).toEqual(expectedState);
  });
});
