import { describe, expect, it, vi } from "vitest";
import { Artifacts } from "../src/artifacts.js";
import { ArtifactStorePort, ArtifactStorePutResult } from "@lcase/ports";
import { createHash } from "crypto";

describe("Artifacts putJson()", () => {
  it("returns ok result when store does not return error", async () => {
    const data = { foo: "bar" };
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const hash = createHash("sha256").update(bytes).digest("hex");

    const mockResult: ArtifactStorePutResult = {
      ok: true,
      path: "test/path",
    };
    const putBytes = vi.fn().mockResolvedValue(mockResult);
    const store = { putBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    const result = await artifacts.putJson(data);

    expect(result).toEqual({ ok: true, value: hash });
    expect(putBytes).toHaveBeenCalledWith(hash, bytes);
  });

  it("returns error result when store returns error", async () => {
    const data = { foo: "bar" };
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    const hash = createHash("sha256").update(bytes).digest("hex");

    const mockResult: ArtifactStorePutResult = {
      ok: false,
      cause: "Error cause",
    };
    const putBytes = vi.fn().mockResolvedValue(mockResult);
    const store = { putBytes } as unknown as ArtifactStorePort;

    const artifacts = new Artifacts(store);
    const result = await artifacts.putJson(data);

    expect(result).toEqual({
      ok: false,
      error: {
        code: "STORE_PUT_FAILED",
        message: "Error putting bytes in store",
        cause: mockResult.cause,
      },
    });
    expect(putBytes).toHaveBeenCalledWith(hash, bytes);
  });
});
