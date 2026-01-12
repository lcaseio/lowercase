import { describe, expect, it } from "vitest";
import { analyzeRefs, findAndParseRefs } from "../src/analyze-references";
import { FlowAnalysis, FlowDefinition, StepHttpJson } from "@lcase/types";

describe("findAndParseRefs()", () => {
  it("find and parses references in a step", () => {
    const httpStep: StepHttpJson = {
      type: "httpjson",
      url: "{{steps.foo}}",
    };
    const flowDef = {
      steps: {
        foo: {
          type: "httpjson",
          url: "url",
        },
        bar: httpStep,
      },
    } as unknown as FlowDefinition;

    const flowAnalysis: FlowAnalysis = {
      nodes: ["foo", "bar"],
      inEdges: {},
      outEdges: {
        foo: [
          {
            endStepId: "bar",
            startStepId: "foo",
            gate: "always",
            type: "control",
          },
        ],
      },
      joinDeps: {},
      refs: [],
      problems: [],
    };

    const expectedFlowAnalysis: FlowAnalysis = {
      nodes: ["foo", "bar"],
      inEdges: {},
      outEdges: {
        foo: [
          {
            endStepId: "bar",
            startStepId: "foo",
            gate: "always",
            type: "control",
          },
        ],
      },
      joinDeps: {},
      refs: [
        {
          path: ["steps", "foo"],
          scope: "steps",
          stepPath: ["url"],
          stepId: "bar",
          string: "steps.foo",
          interpolated: false,
        },
      ],
      problems: [],
    };
    const fd = {
      steps: {},
    } as unknown as FlowDefinition;

    const fa = analyzeRefs(flowDef, flowAnalysis);
    expect(fa).toEqual(expectedFlowAnalysis);
  });
});
