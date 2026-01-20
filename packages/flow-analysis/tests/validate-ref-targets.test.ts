import { describe, expect, it } from "vitest";
import { validateRefTargetStep } from "../src/analyze-references";
import {
  FlowAnalysis,
  FlowDefinition,
  InvalidRefStepIdProblem,
  Ref,
  StepHttpJson,
} from "@lcase/types";

describe("validateRefTargetStep()", () => {
  it("validates a correct step reference", () => {
    const ref: Ref = {
      valuePath: ["steps", "foo"],
      scope: "steps",
      bindPath: ["url"],
      stepId: "bar",
      string: "steps.foo",
      hash: null,
      interpolated: false,
    };
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
    const problem = validateRefTargetStep(ref, flowDef, flowAnalysis);
    expect(problem).toBe(undefined);
  });
  it("invalidates an incorrect step reference", () => {
    const ref: Ref = {
      valuePath: ["steps", "foo"],
      scope: "steps",
      bindPath: ["url"],
      stepId: "bar",
      string: "steps.foo",
      hash: null,
      interpolated: false,
    };
    const httpStep: StepHttpJson = {
      type: "httpjson",
      url: "{{steps.foo}}",
    };
    const flowDef = {
      steps: {
        other: {
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
    const expectedProblem: InvalidRefStepIdProblem = {
      type: "InvalidRefStepId",
      ref: {
        valuePath: ["steps", "foo"],
        scope: "steps",
        stepId: "bar",
        bindPath: ["url"],
        string: "steps.foo",
        hash: null,
        interpolated: false,
      },
      targetStepId: "foo",
    };
    const problem = validateRefTargetStep(ref, flowDef, flowAnalysis);
    expect(problem).toEqual(expectedProblem);
  });
});
