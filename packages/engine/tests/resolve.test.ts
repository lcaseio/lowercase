import { describe, it, expect } from "vitest";
import {
  getSelector,
  parseArray,
  parsePath,
  type Part,
  extractPathValue,
} from "../src/resolve.js";

describe("resolve", () => {
  it("resolvePath resolves nested multi dimensional arrays", () => {
    const object = {
      test: [
        {
          thing: {
            other: [5, [4, 9]],
          },
        },
      ],
      null: null,
    };
    const parts: Part[] = [
      { id: "test", type: "objectKey" },
      { id: "0", type: "arrayIndex" },
      { id: "thing", type: "objectKey" },
      { id: "other", type: "objectKey" },
      { id: "1", type: "arrayIndex" },
      { id: "1", type: "arrayIndex" },
    ];
    const value = extractPathValue(parts, object);
    expect(value).toEqual(9);
  });

  it("resolvePath resolves nested multi dimensional arrays", () => {
    const object = {
      test: [
        {
          thing: {
            other: [5, [4, 9]],
          },
        },
      ],
      null: null,
    };
    const parts: Part[] = [
      { id: "test", type: "objectKey" },
      { id: "0", type: "arrayIndex" },
      { id: "thing", type: "objectKey" },
      { id: "other", type: "objectKey" },
    ];
    const value = extractPathValue(parts, object);
    expect(value).toEqual([5, [4, 9]]);
  });

  it("resolvePath resolves nested multi dimensional arrays", () => {
    const object = {
      test: [
        {
          thing: {
            other: [5, [4, 9]],
          },
        },
      ],
      null: null,
    };
    const parts: Part[] = [
      { id: "test", type: "objectKey" },
      { id: "0", type: "arrayIndex" },
      { id: "thing", type: "objectKey" },
      { id: "other", type: "objectKey" },
    ];
    const value = extractPathValue(parts, object);
    expect(value).toEqual([5, [4, 9]]);
  });

  it("parseSelector parses correctly", () => {
    const path = "test[0].thing.other[4][5]";
    const parts = parsePath(path);
    expect(parts.length).toEqual(6);
    expect(parts[0]).toEqual({ id: "test", type: "objectKey" });
    expect(parts[1]).toEqual({ id: "0", type: "arrayIndex" });
    expect(parts[2]).toEqual({ id: "thing", type: "objectKey" });
    expect(parts[3]).toEqual({ id: "other", type: "objectKey" });
    expect(parts[4]).toEqual({ id: "4", type: "arrayIndex" });
    expect(parts[5]).toEqual({ id: "5", type: "arrayIndex" });
  });
  it("parseArray parses correctly", () => {
    const selector = "press[1][24][2]";
    const parts = parseArray(selector);
    const results = { key: "press", index: ["1", "24", "2"] };
    expect(parts).toEqual(results);
  });
  it("parseSelector parses correctly", () => {
    const selector = "${test[0].thing.other[4][5]}";
    const path = getSelector(selector);
    expect(path).toEqual("test[0].thing.other[4][5]");
  });
});
