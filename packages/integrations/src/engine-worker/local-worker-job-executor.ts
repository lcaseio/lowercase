import type {
  JobExecutorOptions,
  JobExecutorPort,
  JobExecutionOutcome,
  JobExecutionRequest,
} from "@lcase/ports/engine";
import type { JobExecutionPort } from "@lcase/worker";
import { toExecuteJobCommand, toJobExecutionOutcome } from "./mapper.js";

// The local integration adapter: implements engine's own JobExecutorPort by
// calling worker's JobExecutionPort inbound port directly, in-process.
// Deliberately the only file that imports both
// @lcase/ports/engine and @lcase/worker at once -- engine and worker cores
// never import each other; packages/runtime constructs and wires this in.
//
// Pure translation, no side effects of its own: it does not publish anything
// on the bus. The compat job.httpjson.completed/.failed event that keeps the
// UI event graph/replay log populated is published from
// packages/components/engine's own effect handler instead (which already
// builds an equivalent AnyEvent to satisfy JobFinishedMsg's unchanged shape --
// publishing that same object is that effect's job, not this adapter's).
export class LocalWorkerJobExecutor implements JobExecutorPort {
  constructor(private readonly worker: JobExecutionPort) {}

  async execute(
    request: JobExecutionRequest,
    options?: JobExecutorOptions,
  ): Promise<JobExecutionOutcome> {
    const command = toExecuteJobCommand(request);
    const result = await this.worker.execute(command, {
      signal: options?.signal,
    });
    return toJobExecutionOutcome(result);
  }
}
