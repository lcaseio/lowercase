import type {
  ExecuteJobCommand,
  JobExecutionOptions,
  JobResult,
} from "../../job.contracts.js";

export interface JobExecutionPort {
  execute(
    command: ExecuteJobCommand,
    options?: JobExecutionOptions,
  ): Promise<JobResult>;
}
