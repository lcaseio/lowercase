import { describe, it, expect } from "vitest";
import { interpolateRef } from "../../src/references/bind.js";
import type { Ref } from "@lcase/types";

describe("interplaceRef()", () => {
  it("does not interpolate when ref is not flagged as interpolated", () => {
    const ref: Ref = {
      path: [],
      scope: "steps",
      stepId: "",
      stepPath: [],
      string: "",
      interpolated: false,
    };
    const result = interpolateRef("", "bar", ref);
    expect(result).toBe("bar");
  });
  it("interpolates when ref flagged as interpolated and field is a string", () => {
    const ref: Ref = {
      path: [],
      scope: "steps",
      stepId: "",
      stepPath: [],
      string: "place",
      interpolated: true,
    };
    const result = interpolateRef("Hello {{place}}", "bar", ref);
    expect(result).toBe("Hello bar");
  });

  it("interpolates numbers when ref flagged as interpolated and field is a string", () => {
    const ref: Ref = {
      path: [],
      scope: "steps",
      stepId: "",
      stepPath: [],
      string: "place",
      interpolated: true,
    };
    const result = interpolateRef("Hello {{place}}", 5, ref);
    expect(result).toBe("Hello 5");
  });

  it("returns value when interpolated is set but field is not a string", () => {
    const ref: Ref = {
      path: [],
      scope: "steps",
      stepId: "",
      stepPath: [],
      string: "place",
      interpolated: true,
    };
    const result = interpolateRef(5, "bar", ref);
    expect(result).toBe("bar");
  });
});
