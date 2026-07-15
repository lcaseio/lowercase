import { describe, expect, it } from "vitest";
import type { FlowDefinition, Ref } from "@lcase/types";
import {
  buildParamRefUsage,
  findParamRefs,
  interpolateRefLocal,
  renderParamRefReport,
} from "@/lib/param-ref-preview";

function makeRef(overrides: Partial<Ref>): Ref {
  return {
    valuePath: ["params", "userWeatherQuery"],
    scope: "params",
    stepId: "one",
    bindPath: ["body"],
    string: "params.userWeatherQuery",
    interpolated: false,
    hash: null,
    ...overrides,
  };
}

const flowDef: FlowDefinition = {
  name: "test",
  version: "1.0.0",
  start: "one",
  steps: {
    one: {
      type: "httpjson",
      url: "https://example.com",
      body: {
        model: "local-mistral",
        messages: [
          { role: "system", content: "{{params.systemParser}}" },
          {
            role: "user",
            content: "Question: {{params.userWeatherQuery}} please",
          },
        ],
      },
    },
  },
};

describe("findParamRefs", () => {
  it("filters refs by scope and param name", () => {
    const refs: Ref[] = [
      makeRef({ valuePath: ["params", "userWeatherQuery"] }),
      makeRef({ valuePath: ["params", "systemParser"] }),
      makeRef({ scope: "steps", valuePath: ["steps", "one", "output"] }),
    ];
    expect(findParamRefs(refs, "userWeatherQuery")).toHaveLength(1);
    expect(findParamRefs(refs, "systemParser")).toHaveLength(1);
    expect(findParamRefs(refs, "nonexistent")).toHaveLength(0);
  });
});

describe("interpolateRefLocal", () => {
  it("returns the value as-is for whole-value (non-string) refs", () => {
    const ref = makeRef({ interpolated: false });
    const value = { location: "Seattle" };
    expect(interpolateRefLocal("{{params.userWeatherQuery}}", value, ref)).toBe(value);
  });

  it("returns the value as-is for whole-value string refs", () => {
    const ref = makeRef({ interpolated: false });
    expect(interpolateRefLocal("{{params.userWeatherQuery}}", "hello", ref)).toBe("hello");
  });

  it("substitutes a single embedded ref into a larger string", () => {
    const ref = makeRef({
      interpolated: true,
      string: "params.userWeatherQuery",
    });
    const result = interpolateRefLocal(
      "Question: {{params.userWeatherQuery}} please",
      "will it rain",
      ref,
    );
    expect(result).toBe("Question: will it rain please");
  });

  it("JSON-stringifies non-string values when interpolated into a larger string", () => {
    const ref = makeRef({ interpolated: true, string: "params.userWeatherQuery" });
    const result = interpolateRefLocal(
      "data: {{params.userWeatherQuery}}",
      { a: 1 },
      ref,
    );
    expect(result).toBe('data: {"a":1}');
  });

  it("substitutes multiple refs joined in one string, one call per ref", () => {
    const ref1 = makeRef({ interpolated: true, string: "params.a" });
    const ref2 = makeRef({ interpolated: true, string: "params.b" });
    let field: unknown = "{{params.a}}-{{params.b}}";
    field = interpolateRefLocal(field, "x", ref1);
    field = interpolateRefLocal(field, "y", ref2);
    expect(field).toBe("x-y");
  });
});

describe("buildParamRefUsage", () => {
  it("resolves a whole-value JSON param ref", () => {
    const ref = makeRef({
      stepId: "one",
      bindPath: ["body", "messages", 0, "content"],
      string: "params.systemParser",
      interpolated: false,
    });
    const usage = buildParamRefUsage(ref, flowDef, {
      format: "json",
      value: { role: "system" },
    });
    expect(usage.resolved).toBe(true);
    expect(usage.interpolatedResult).toEqual({ role: "system" });
  });

  it("resolves an interpolated text param ref embedded in a larger string", () => {
    const ref = makeRef({
      stepId: "one",
      bindPath: ["body", "messages", 1, "content"],
      string: "params.userWeatherQuery",
      interpolated: true,
    });
    const usage = buildParamRefUsage(ref, flowDef, {
      format: "text",
      value: "will it rain",
    });
    expect(usage.resolved).toBe(true);
    expect(usage.interpolatedResult).toBe("Question: will it rain please");
  });

  it("marks a usage unresolved when the JSON sub-path doesn't exist on the artifact", () => {
    const ref = makeRef({
      stepId: "one",
      bindPath: ["body", "messages", 0, "content"],
      valuePath: ["params", "foo", "bar"],
      string: "params.foo.bar",
      interpolated: false,
    });
    const usage = buildParamRefUsage(ref, flowDef, {
      format: "json",
      value: { notBar: true },
    });
    expect(usage.resolved).toBe(false);
  });
});

describe("renderParamRefReport", () => {
  it("reports no usages when the list is empty", () => {
    expect(renderParamRefReport("userWeatherQuery", [])).toContain("No usages");
  });

  it("includes a could-not-resolve marker for unresolved usages", () => {
    const ref = makeRef({ string: "params.foo.bar" });
    const report = renderParamRefReport("foo", [
      { ref, resolved: false, originalField: "{{params.foo.bar}}", interpolatedResult: "{{params.foo.bar}}" },
    ]);
    expect(report).toContain("could not resolve");
    expect(report).toContain("params.foo.bar");
  });

  it("renders resolved usages with the interpolated result", () => {
    const ref = makeRef({ stepId: "one", bindPath: ["body", "messages", 1, "content"] });
    const report = renderParamRefReport("userWeatherQuery", [
      {
        ref,
        resolved: true,
        originalField: "Question: {{params.userWeatherQuery}} please",
        interpolatedResult: "Question: will it rain please",
      },
    ]);
    expect(report).toContain("Question: will it rain please");
    expect(report).toContain('Step "one"');
  });
});
