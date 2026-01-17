import { describe, expect, it, vi } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import { ArtifactStorePort } from "@lcase/ports";

describe("Artifacts getJson()", () => {
  it("returns ok result when store returns valid json bytes", async () => {
    const data = { foo: "bar" };
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const hash = "test-hash";

    const getBytes = vi.fn().mockResolvedValue(bytes);
    const store = { getBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    const result = await artifacts.getJson(hash);

    expect(result).toEqual({ ok: true, value: data });
    expect(getBytes).toHaveBeenCalledWith(hash);
  });

  it("returns STORE_GET_FAILED error when store returns null", async () => {
    const hash = "test-hash";

    const getBytes = vi.fn().mockResolvedValue(null);
    const store = { getBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    const result = await artifacts.getJson(hash);

    const expectedResult = {
      ok: false,
      error: {
        code: "STORE_GET_FAILED",
        message: "Store returned null",
      },
    };
    expect(result).toEqual(expectedResult);
    expect(getBytes).toHaveBeenCalledWith(hash);
  });

  it("returns JSON_PARSE_FAILED error when store returns invalid json", async () => {
    const bytes = new TextEncoder().encode("() => {}");
    const hash = "test-hash";

    const getBytes = vi.fn().mockResolvedValue(bytes);
    const store = { getBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    const result = await artifacts.getJson(hash);

    if (!result.ok) {
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("JSON_PARSE_FAILED");
      expect(result.error.message).toBe("Error parsing json");
      expect(result.error.cause).toBeTypeOf("string");
      expect(getBytes).toHaveBeenCalledWith(hash);
    } else {
      throw new Error("expected error");
    }
  });
});
