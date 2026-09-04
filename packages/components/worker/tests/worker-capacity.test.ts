import { describe, expect, it, vi } from "vitest";
import { withWorkerCapacity } from "../src/worker-capacity.js";
import type { JobCommandExecutor, JobResult } from "../src/job.contracts.js";
import { makeCommand } from "./helpers/fixtures.js";

function makeControllableCore() {
  const releases: Array<() => void> = [];
  const executeCalls: number[] = [];
  const core: JobCommandExecutor = {
    execute: vi.fn(async (command): Promise<JobResult> => {
      executeCalls.push(executeCalls.length);
      await new Promise<void>((resolve) => releases.push(resolve));
      return {
        status: "completed",
        executionId: command.executionId,
        jobId: command.jobId,
        output: { hash: "fake-hash" },
      };
    }),
  };
  return { core, releases, executeCalls };
}

describe("withWorkerCapacity", () => {
  it("passes a single job straight through", async () => {
    const core: JobCommandExecutor = {
      execute: vi.fn(async (command): Promise<JobResult> => ({
        status: "completed",
        executionId: command.executionId,
        jobId: command.jobId,
        output: { hash: "fake-hash" },
      })),
    };
    const worker = withWorkerCapacity(core, { maxConcurrentJobs: 1 });

    const result = await worker.execute(makeCommand());

    expect(result.status).toBe("completed");
    expect(core.execute).toHaveBeenCalledTimes(1);
  });

  it("blocks a second job until the first completes and releases capacity", async () => {
    const { core, releases } = makeControllableCore();
    const worker = withWorkerCapacity(core, { maxConcurrentJobs: 1 });

    const firstPromise = worker.execute(makeCommand({ executionId: "exec-1" }));
    await vi.waitFor(() => expect(releases).toHaveLength(1));

    let secondSettled = false;
    const secondPromise = worker
      .execute(makeCommand({ executionId: "exec-2" }))
      .then((result) => {
        secondSettled = true;
        return result;
      });

    // Give the event loop a chance -- the second call must still be queued.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(secondSettled).toBe(false);
    expect(core.execute).toHaveBeenCalledTimes(1);

    releases[0]!();
    await firstPromise;
    await vi.waitFor(() => expect(releases).toHaveLength(2));
    releases[1]!();
    const second = await secondPromise;

    expect(secondSettled).toBe(true);
    expect(second.status).toBe("completed");
    expect(core.execute).toHaveBeenCalledTimes(2);
  });

  it("aborting while queued for capacity resolves CANCELLED without ever calling the wrapped core", async () => {
    const { core, releases } = makeControllableCore();
    const worker = withWorkerCapacity(core, { maxConcurrentJobs: 1 });

    const firstPromise = worker.execute(makeCommand({ executionId: "exec-1" }));
    await vi.waitFor(() => expect(releases).toHaveLength(1));

    const controller = new AbortController();
    const secondPromise = worker.execute(
      makeCommand({ executionId: "exec-2" }),
      {
        signal: controller.signal,
      },
    );
    controller.abort();
    const second = await secondPromise;

    expect(second).toMatchObject({
      status: "failed",
      error: { code: "CANCELLED" },
    });
    expect(core.execute).toHaveBeenCalledTimes(1); // only the first job ever ran

    releases[0]!();
    await firstPromise;
  });

  it("releases capacity even when the wrapped core throws", async () => {
    const thrown = new Error("boom");
    const core: JobCommandExecutor = {
      execute: vi.fn(async () => {
        throw thrown;
      }),
    };
    const worker = withWorkerCapacity(core, { maxConcurrentJobs: 1 });

    await expect(
      worker.execute(makeCommand({ executionId: "exec-1" })),
    ).rejects.toBe(thrown);

    // Capacity must have been released -- a second call should reach the
    // core rather than hang forever queued behind the first.
    await expect(
      worker.execute(makeCommand({ executionId: "exec-2" })),
    ).rejects.toBe(thrown);
    expect(core.execute).toHaveBeenCalledTimes(2);
  });
});
