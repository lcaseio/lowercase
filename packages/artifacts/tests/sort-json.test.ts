import { describe, expect, it } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import type { ArtifactStorePort, JsonValue } from "@lcase/ports";

describe("Artifacts sortJson()", () => {
  it("sorts object keys", () => {
    const data: JsonValue = { b: 1, a: 2 };

    const store = {} as ArtifactStorePort;
    const artifacts = new Artifacts(store);
    const sortedData = artifacts.sortJson(data);

    const expectedStringifiedData = '{"a":2,"b":1}';
    const sortedDataStringified = JSON.stringify(sortedData);

    expect(sortedDataStringified).toBe(expectedStringifiedData);
  });
  it("sorts nested object keys", () => {
    const data: JsonValue = { b: { y: 2, x: 1 }, a: 2 };

    const store = {} as ArtifactStorePort;
    const artifacts = new Artifacts(store);
    const sortedData = artifacts.sortJson(data);

    const expectedStringifiedData = '{"a":2,"b":{"x":1,"y":2}}';
    const sortedDataStringified = JSON.stringify(sortedData);

    expect(sortedDataStringified).toBe(expectedStringifiedData);
  });
  it("sorts nested object keys", () => {
    const data: JsonValue = { b: { y: 2, x: 1 }, a: 2 };

    const store = {} as ArtifactStorePort;
    const artifacts = new Artifacts(store);
    const sortedData = artifacts.sortJson(data);

    const expectedStringifiedData = '{"a":2,"b":{"x":1,"y":2}}';
    const sortedDataStringified = JSON.stringify(sortedData);

    expect(sortedDataStringified).toBe(expectedStringifiedData);
  });
  it("keeps array order intact", () => {
    const data: JsonValue = [{ b: { y: 2, x: "hello" } }, { a: 2 }];

    const store = {} as ArtifactStorePort;
    const artifacts = new Artifacts(store);
    const sortedData = artifacts.sortJson(data);

    const expectedStringifiedData = '[{"b":{"x":"hello","y":2}},{"a":2}]';
    const sortedDataStringified = JSON.stringify(sortedData);

    expect(sortedDataStringified).toBe(expectedStringifiedData);
  });
  it("string primitives remain unchainged", () => {
    const store = {} as ArtifactStorePort;
    const artifacts = new Artifacts(store);

    expect(artifacts.sortJson("x")).toBe("x");
    expect(artifacts.sortJson(null)).toBe(null);
    expect(artifacts.sortJson(5)).toBe(5);
    expect(artifacts.sortJson(true)).toBe(true);
  });
});
