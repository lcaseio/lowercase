import type {
  JobExecutionOptions,
  JobExecutionOutcome,
  JobExecutionPort,
  JobExecutionRequest,
} from "@lcase/ports";
import type { JobCommandExecutor } from "./job.contracts.js";
import {
  toExecuteJobCommand,
  toJobExecutionOutcome,
} from "./job-message.mappers.js";

// The outermost layer of the worker: turns worker's internal, command-shaped
// execution seam into the shared, message-shaped JobExecutionPort that
// callers actually depend on. Composed outside withWorkerCapacity so both the
// capacity decorator and Worker itself keep speaking ExecuteJobCommand and
// need no knowledge of the message contract at all.
//
// Pure translation with no side effects of its own -- notably it publishes
// nothing. The job.httpjson.completed/.failed events that keep the event
// log/UI graph populated are published by the engine's own effect handler,
// which already builds them from the returned outcome.
export function withMessageJobExecution(
  core: JobCommandExecutor,
): JobExecutionPort {
  return {
    async execute(
      request: JobExecutionRequest,
      options?: JobExecutionOptions,
    ): Promise<JobExecutionOutcome> {
      const result = await core.execute(toExecuteJobCommand(request), options);
      return toJobExecutionOutcome(result);
    },
  };
}
