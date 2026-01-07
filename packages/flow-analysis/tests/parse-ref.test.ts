import { describe, it, expect } from "vitest";
import { parseRef } from "../src/parse-references.js";
import { Ref } from "@lcase/types";

describe("getRegStrings()", () => {
  it("parses simple strings correctly", () => {
    const refs: Ref[] = [];
    parseRef("{{steps.bar}}", ["foo"], "stepId", refs);
    const expectedRefs: Ref[] = [
      {
        path: ["steps", "bar"],
        scope: "steps",
        stepPath: ["foo"],
        stepId: "stepId",
        string: "steps.bar",
      },
    ];
    expect(refs).toEqual(expectedRefs);
  });
});
