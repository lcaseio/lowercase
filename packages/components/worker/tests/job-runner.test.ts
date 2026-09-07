import { describe, expect, it, vi } from "vitest";
import { makeCommand } from "./helpers/fixtures.js";
import { createControllablePermitPort } from "./helpers/fake-resource-permit.js";
import { makeJobRunner } from "./helpers/worker-fakes.js";

describe("JobRunner", () => {
  it("stores the resolved output and reports a completed outcome", async () => {
    const { runner, acquire, release, protocolExecute } = makeJobRunner({
      protocolResult: () => ({ ok: true, payload: { foo: "bar" } }),
    });
    const command = makeCommand();

    const outcome = await runner.run(command);

    if (outcome.kind !== "completed") {
      throw new Error(`expected completed, got ${outcome.kind}`);
    }
    expect(outcome.outputs.output.hash).toMatch(/^fake-hash-/);
    expect(acquire).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith("grant-1");

    // The executor receives the *resolved* request (materialized, defaulted),
    // not the raw template, and none of worker's own identity fields.
    expect(protocolExecute).toHaveBeenCalledTimes(1);
    const [requestArg] = protocolExecute.mock.calls[0]!;
    expect(requestArg).toEqual({
      url: command.protocol.url,
      method: "GET",
      headers: { Accept: "application/json" },
    });
    expect(requestArg).not.toHaveProperty("executionId");
    expect(requestArg).not.toHaveProperty("jobId");
  });

  it("reports an expected protocol failure as a failed outcome rather than throwing", async () => {
    const protocolError = {
      code: "HTTP_STATUS_FAILED" as const,
      message: "upstream said no",
      retryable: true,
    };
    const { runner, release } = makeJobRunner({
      protocolResult: () => ({ ok: false, error: protocolError }),
    });

    const outcome = await runner.run(makeCommand());

    expect(outcome).toEqual({ kind: "failed", error: protocolError });
    expect(release).toHaveBeenCalledTimes(1);
  });

  describe("HTTP request invariants surfaced as typed failures, not thrown errors", () => {
    it("GET with a body is rejected before the protocol executor is ever called", async () => {
      const { runner, protocolExecute } = makeJobRunner();
      const command = makeCommand({
        protocol: {
          kind: "httpjson",
          url: "https://example.test",
          method: "GET",
          body: { not: "allowed" },
        },
      });

      const outcome = await runner.run(command);

      expect(outcome).toMatchObject({
        kind: "failed",
        error: { code: "HTTP_REQUEST_INVALID", retryable: false },
      });
      expect(protocolExecute).not.toHaveBeenCalled();
    });

    it("a non-http(s) URL scheme is rejected before the protocol executor is ever called", async () => {
      const { runner, protocolExecute } = makeJobRunner();
      const command = makeCommand({
        protocol: { kind: "httpjson", url: "file:///etc/passwd" },
      });

      const outcome = await runner.run(command);

      expect(outcome).toMatchObject({
        kind: "failed",
        error: { code: "HTTP_REQUEST_INVALID" },
      });
      expect(protocolExecute).not.toHaveBeenCalled();
    });
  });

  it("resource-key resolution failure short-circuits before any permit or protocol interaction", async () => {
    const resourceKeyResolver = vi.fn(() => ({
      ok: false as const,
      message: "no policy configured",
    }));
    const { runner, acquire, protocolExecute } = makeJobRunner({
      resourceKeyResolver,
    });

    const outcome = await runner.run(makeCommand());

    expect(outcome).toMatchObject({
      kind: "failed",
      error: { code: "RESOURCE_KEY_RESOLUTION_FAILED", retryable: false },
    });
    expect(acquire).not.toHaveBeenCalled();
    expect(protocolExecute).not.toHaveBeenCalled();
  });

  it("a protocol call exceeding protocolTimeoutMs produces a distinct TIMEOUT failure, never a cancellation", async () => {
    const { runner, release } = makeJobRunner({
      protocolTimeoutMs: 20,
      // Never resolves on its own -- only the worker's own timeout signal
      // firing settles this call.
      protocolResult: () =>
        new Promise(() => {
          // intentionally never settles
        }),
    });

    const outcome = await runner.run(makeCommand());

    expect(outcome).toMatchObject({
      kind: "failed",
      error: { code: "TIMEOUT", retryable: false },
    });
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("aborting the caller signal mid-wait-for-permit reports cancelled and never calls the protocol", async () => {
    const permits = createControllablePermitPort();
    const { runner, protocolExecute, release } = makeJobRunner({ permits });
    const controller = new AbortController();

    const outcomePromise = runner.run(makeCommand(), controller.signal);
    await vi.waitFor(() => expect(permits.acquire).toHaveBeenCalled());
    controller.abort();

    expect(await outcomePromise).toEqual({ kind: "cancelled" });
    expect(protocolExecute).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  // Real ref-resolution coverage: every other test here uses an empty `refs`
  // array, so #resolveOneRef's actual reader.load() calls would otherwise be
  // exercised nowhere.
  describe("ref resolution through the reader", () => {
    it("resolves a params-scope text/plain ref into the materialized request", async () => {
      const fakes = makeJobRunner();
      fakes.seed("hash-param", "text/plain", "42");
      const command = makeCommand({
        protocol: {
          kind: "httpjson",
          url: "https://example.test/users/{{params.id}}",
        },
        refs: [
          {
            valuePath: ["url"],
            scope: "params",
            stepId: "step-1",
            bindPath: ["url"],
            string: "params.id",
            interpolated: true,
            hash: "hash-param",
            paramType: "text/plain",
          },
        ],
      });

      await fakes.runner.run(command);

      expect(fakes.protocolExecute).toHaveBeenCalledTimes(1);
      const [requestArg] = fakes.protocolExecute.mock.calls[0]!;
      expect(requestArg).toMatchObject({
        url: "https://example.test/users/42",
      });
    });

    it("resolves a steps-scope JSON ref into the materialized request via its valuePath", async () => {
      const fakes = makeJobRunner();
      fakes.seed("hash-step", "application/json", { output: { id: "99" } });
      const command = makeCommand({
        protocol: {
          kind: "httpjson",
          url: "https://example.test/users/{{steps.step-0.output.id}}",
        },
        refs: [
          {
            valuePath: ["output", "id"],
            scope: "steps",
            stepId: "step-0",
            bindPath: ["url"],
            string: "steps.step-0.output.id",
            interpolated: true,
            hash: "hash-step",
          },
        ],
      });

      await fakes.runner.run(command);

      expect(fakes.protocolExecute).toHaveBeenCalledTimes(1);
      const [requestArg] = fakes.protocolExecute.mock.calls[0]!;
      expect(requestArg).toMatchObject({
        url: "https://example.test/users/99",
      });
    });
  });
});
