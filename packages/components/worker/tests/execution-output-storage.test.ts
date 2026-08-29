import type { ExportRef } from "@lcase/types";
import { describe, expect, it, vi } from "vitest";
import { storeExecutionOutputs } from "../src/execution-output-storage.js";
import { createFakeArtifactsPort } from "./helpers/fake-artifacts.js";

function makeExport(overrides: Partial<ExportRef> = {}): ExportRef {
  return {
    exportName: "result",
    valuePath: ["output", "result"],
    scope: "output",
    string: "steps.x.exports.result",
    type: "application/json",
    ...overrides,
  };
}

describe("storeExecutionOutputs", () => {
  it("parses a JSON string before storing an application/json export", async () => {
    const { artifacts, store } = createFakeArtifactsPort();

    const result = await storeExecutionOutputs(
      artifacts,
      { result: '{"answer":42}' },
      { result: makeExport() },
    );

    if (!result.ok) throw new Error(result.error.message);
    expect(store.get(result.outputs.output.hash)).toEqual({
      format: "json",
      value: { result: '{"answer":42}' },
    });
    expect(store.get(result.outputs.exports!.result!.hash)).toEqual({
      format: "json",
      value: { answer: 42 },
    });
  });

  it("classifies malformed JSON as an export-resolution failure", async () => {
    const { artifacts } = createFakeArtifactsPort();

    const result = await storeExecutionOutputs(
      artifacts,
      { result: "not-json" },
      { result: makeExport() },
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "EXPORT_RESOLUTION_FAILED",
        message: expect.stringContaining(
          'Export "result" could not be parsed as JSON',
        ),
        retryable: false,
      },
      output: { hash: "fake-hash-1" },
    });
  });

  it("retains the primary output when an export path cannot be resolved", async () => {
    const { artifacts, store } = createFakeArtifactsPort();

    const result = await storeExecutionOutputs(
      artifacts,
      { other: "value" },
      { result: makeExport() },
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "EXPORT_RESOLUTION_FAILED",
        retryable: false,
      },
      output: { hash: "fake-hash-1" },
    });
    expect(store.get("fake-hash-1")).toEqual({
      format: "json",
      value: { other: "value" },
    });
  });

  it("rejects a non-string text export after storing the primary output", async () => {
    const { artifacts } = createFakeArtifactsPort();

    const result = await storeExecutionOutputs(
      artifacts,
      { result: { answer: 42 } },
      {
        result: makeExport({
          type: "text/plain",
        }),
      },
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "EXPORT_RESOLUTION_FAILED",
        message:
          'Export "result" declared text/plain but resolved value is not a string',
        retryable: false,
      },
      output: { hash: "fake-hash-1" },
    });
  });

  it("retains the primary output when storing an export fails", async () => {
    const { artifacts } = createFakeArtifactsPort();
    vi.spyOn(artifacts, "putText").mockResolvedValue({
      ok: false,
      error: { code: "STORE_PUT_FAILED", message: "export disk full" },
    });

    const result = await storeExecutionOutputs(
      artifacts,
      { result: "hello" },
      {
        result: makeExport({
          type: "text/plain",
        }),
      },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "EXPORT_STORE_FAILED",
        message: "export disk full",
        retryable: false,
      },
      output: { hash: "fake-hash-1" },
    });
  });
});
