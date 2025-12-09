import { describe, it, expect } from "vitest";
import { makeJoinSetsForSteps } from "../src/reducers/flow-submitted.reducer";
import { StepDefinition } from "@lcase/types";

describe("makeJoinSetsForSteps", () => {
  it("does the right thing", () => {
    const stepDefinitions: Record<string, StepDefinition> = {
      foo: {
        type: "httpjson",
        url: "",
      },
      bar: {
        type: "httpjson",
        url: "",
      },
      join: {
        type: "join",
        steps: ["bar", "foo"],
        next: "other",
      },
      joinTwo: {
        type: "join",
        steps: ["foo"],
        next: "other",
      },
    };
    const joinMap = makeJoinSetsForSteps(stepDefinitions);

    const expectedJoinMap: Record<string, Set<string>> = {
      foo: new Set(["join", "joinTwo"]),
      bar: new Set(["join"]),
    };
    expect(joinMap).toEqual(expectedJoinMap);
  });
});
