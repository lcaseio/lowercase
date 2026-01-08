import { describe, it, expect } from "vitest";
import { parseStepRefs } from "../src/parse-references.js";
import { Ref, StepHttpJson } from "@lcase/types";

describe("parseStepRefs()", () => {
  it("returns empty array when no refs are found", () => {
    const refs: Ref[] = [];

    const httpStep: StepHttpJson = {
      type: "httpjson",
      url: "test",
    };
    const r = parseStepRefs(httpStep, "stepId");

    const expectedOutput = {
      refs: [],
      problems: [],
    };

    expect(r).toEqual(expectedOutput);
  });
  it("returns correct ref when parse is valid", () => {
    const refs: Ref[] = [];

    const httpStep: StepHttpJson = {
      type: "httpjson",
      url: "{{steps.foo}}",
    };
    const r = parseStepRefs(httpStep, "stepId");

    const expectedRefs: Ref[] = [
      {
        path: ["steps", "foo"],
        scope: "steps",
        stepPath: ["url"],
        stepId: "stepId",
        string: "steps.foo",
      },
    ];

    const expectedOutput = {
      refs: expectedRefs,
      problems: [],
    };
    expect(r).toEqual(expectedOutput);
  });
});
