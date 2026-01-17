import { describe, expect, it } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import { ArtifactStorePort } from "@lcase/ports";
describe("Artifacts hashJson()", () => {
  it("creates a valid hash for supplied json", () => {
    const data = { foo: "bar" };
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const expectedHash =
      "7a38bf81f383f69433ad6e900d35b3e2385593f76a7b7ab5d4355b8ba41ee24b";

    const store = {} as ArtifactStorePort;
    const artifacts = new Artifacts(store);
    const hash = artifacts.hashBytes(bytes);
    expect(hash).toBe(expectedHash);
  });
});
