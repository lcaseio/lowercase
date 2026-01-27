import { describe, it, expect } from "vitest";
import { runIndexResultReducer } from "../../src/reducers/run-index-result.reducer.js";
import type { RunIndexResultMsg } from "../../src/types/message.types.js";

import { forkSpecOkState } from "../fixtures/fork-spec-result.state.js";
import {
  runIndexResultNotOkState,
  runIndexResultOkState,
} from "../fixtures/run-index-result.state.js";

describe("runIndexResultReducer()", () => {
  it("adds run index to state when result returns true", () => {
    const message: RunIndexResultMsg = {
      ok: true,
      runId: "test-runid",
      runIndex: {
        flowId: "test-flowdefhash",
        traceId: "test-traceid",
        steps: {
          b: { outputHash: "test-outputhash", status: "success" },
        },
      },
      type: "RunIndexResult",
    };
    const state = runIndexResultReducer(forkSpecOkState, message);
    expect(state).toEqual(runIndexResultOkState);
  });
  it("sets run state to failed when message is not ok", () => {
    const message: RunIndexResultMsg = {
      ok: false,
      runId: "test-runid",
      type: "RunIndexResult",
      error: "test-error",
    };
    const state = runIndexResultReducer(forkSpecOkState, message);
    expect(state).toEqual(runIndexResultNotOkState);
  });
});
