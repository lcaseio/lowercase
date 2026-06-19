import { describe, expect, it } from "vitest";
import type { Ref, RunContext } from "@lcase/types";
import { getStepRefHash, makeStepRefs } from "../src/references/value-refs.js";

describe("value refs", () => {
  it("resolves export hashes for steps.<id>.exports.<name>", () => {
    const ref: Ref = {
      valuePath: ["steps", "foo", "exports", "parsed"],
      scope: "steps",
      stepId: "bar",
      bindPath: ["body"],
      string: "steps.foo.exports.parsed",
      interpolated: false,
      hash: null,
    };
    const steps = {
      foo: {
        status: "completed",
        attempt: 1,
        output: null,
        outputHash: "output-hash",
        exportHashes: {
          parsed: "parsed-hash",
        },
        resolved: {},
      },
    } satisfies RunContext["steps"];

    expect(getStepRefHash(ref, steps)).toBe("parsed-hash");
    expect(makeStepRefs("bar", [ref], steps)).toEqual([
      {
        ...ref,
        valuePath: [],
        hash: "parsed-hash",
      },
    ]);
  });

  it("keeps direct step output refs relative to the primary artifact", () => {
    const ref: Ref = {
      valuePath: ["steps", "foo", "body", "answer"],
      scope: "steps",
      stepId: "bar",
      bindPath: ["body"],
      string: "steps.foo.body.answer",
      interpolated: false,
      hash: null,
    };
    const steps = {
      foo: {
        status: "completed",
        attempt: 1,
        output: null,
        outputHash: "output-hash",
        exportHashes: {},
        resolved: {},
      },
    } satisfies RunContext["steps"];

    expect(makeStepRefs("bar", [ref], steps)).toEqual([
      {
        ...ref,
        valuePath: ["body", "answer"],
        hash: "output-hash",
      },
    ]);
  });
});
