import type {
  CreateEvalResultInput,
  EvalResultRecord,
  Result,
} from "@lcase/types";

export interface EvalResultRepositoryPort {
  createEvalResult(
    input: CreateEvalResultInput,
  ): Promise<Result<EvalResultRecord, string>>;
  listByExperimentId(experimentId: string): Promise<EvalResultRecord[]>;
  listByTargetRunId(targetRunId: string): Promise<EvalResultRecord[]>;
  listByTargetShape(shape: {
    flowId: string;
    stepId: string;
    exportName: string;
  }): Promise<EvalResultRecord[]>;
}
