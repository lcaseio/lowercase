import { describe, it, expect } from "vitest";
import { runStartedReducer } from "../../src/reducers/run-started.reducuer.js";
import { EngineState, RunStartedMsg } from "../../src/engine.types.js";
import { runStartedEvent } from "../fixtures/run-started.event.js";
import { flowSubmittedNewState } from "../fixtures/flow-submitted.state.js";
import { runStartedNewState } from "../fixtures/run-started.state.js";

describe("runStartedReducer", () => {
  it("updates start step + run status to planned when state is initialized", () => {
    const message: RunStartedMsg = {
      type: "RunStarted",
      event: runStartedEvent,
    };

    // state the flowSubmittedReducer produced
    const oldState: EngineState = flowSubmittedNewState;
    const newState: EngineState = runStartedNewState;

    const state = runStartedReducer(oldState, message);
    expect(state).toEqual(newState);
  });
  it("makes no changes when no run context is found for runid", () => {
    const message: RunStartedMsg = {
      type: "RunStarted",
      event: runStartedEvent,
    };

    // state the flowSubmittedReducer produced
    const oldState: EngineState = structuredClone(flowSubmittedNewState);

    delete oldState.runs["test-runid"];
    const newState: EngineState = runStartedNewState;

    const state = runStartedReducer(oldState, message);
    expect(state).toEqual(oldState);
  });
  it("makes no changes when no flow context is found for flowid", () => {
    const message: RunStartedMsg = {
      type: "RunStarted",
      event: runStartedEvent,
    };

    // state the flowSubmittedReducer produced
    const oldState: EngineState = structuredClone(flowSubmittedNewState);

    delete oldState.flows["test-flowid"];
    const newState: EngineState = runStartedNewState;

    const state = runStartedReducer(oldState, message);
    expect(state).toEqual(oldState);
  });
  it("makes no changes when no valid start step is found in flow definition", () => {
    const message: RunStartedMsg = {
      type: "RunStarted",
      event: runStartedEvent,
    };

    // state the flowSubmittedReducer produced
    const oldState: EngineState = structuredClone(flowSubmittedNewState);

    oldState.flows["test-flowid"].definition.start = "";
    const newState: EngineState = runStartedNewState;

    const state = runStartedReducer(oldState, message);
    expect(state).toEqual(oldState);
  });
});
