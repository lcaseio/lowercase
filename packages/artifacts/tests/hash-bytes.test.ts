import { describe, expect, it } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import type { LegacyArtifactStorePort } from "@lcase/ports";
import { createHash } from "crypto";

describe("Artifacts hashJson()", () => {
  it("creates a valid hash for supplied json", () => {
    const data = { foo: "bar" };
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const expectedHash = createHash("sha256").update(bytes).digest("hex");

    const store = {} as LegacyArtifactStorePort;
    const artifacts = new Artifacts(store);
    const hash = artifacts.hashBytes(bytes);
    expect(hash).toBe(expectedHash);
  });
});
