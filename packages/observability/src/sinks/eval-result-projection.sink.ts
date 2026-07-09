import type {
  ArtifactsPort,
  EventSink,
  EvalResultRepositoryPort,
  RunQueryPort,
} from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";
import { EvalScorePayloadSchema } from "@lcase/specs";

const JUDGE_STEP_ID = "judge";
const JUDGE_EXPORT_NAME = "score";

type ShadowEvalRunState = {
  targetRunId: string;
  targetStepId?: string;
  targetExportName?: string;
  evalFlowId?: string;
  evalFlowVersionId?: string;
  experimentId?: string;
};

export class EvalResultProjectionSink implements EventSink {
  id = "eval-result-projection-sink";
  #enableSink = true;
  #states = new Map<string, ShadowEvalRunState>();

  constructor(
    private readonly evalResults: EvalResultRepositoryPort,
    private readonly artifacts: ArtifactsPort,
    private readonly runQuery: RunQueryPort,
  ) {}

  async start(): Promise<void> {
    this.#enableSink = true;
  }

  async stop(): Promise<void> {
    this.#enableSink = false;
  }

  handle(event: AnyEvent): void {
    if (!this.#enableSink) return;

    if (event.type === "run.requested") {
      this.#onRunRequested(event as AnyEvent<"run.requested">);
      return;
    }

    if (event.type === "run.completed") {
      void this.#onRunCompleted(event as AnyEvent<"run.completed">);
    }
  }

  #onRunRequested(event: AnyEvent<"run.requested">): void {
    const { targetRunId, targetStepId, targetExportName, experimentId } =
      event.data;
    if (!targetRunId) return;

    this.#states.set(event.runid, {
      targetRunId,
      targetStepId,
      targetExportName,
      experimentId,
      evalFlowId: event.data.flowId,
      evalFlowVersionId: event.data.flowVersionId,
    });
  }

  async #onRunCompleted(event: AnyEvent<"run.completed">): Promise<void> {
    const evalRunId = event.runid;
    const state = this.#states.get(evalRunId);
    if (!state) return;
    this.#states.delete(evalRunId);

    const detailResult = await this.runQuery.getRunDetail(evalRunId);
    if (!detailResult.ok) {
      console.error(
        `[eval-result-projection-sink] unable to read eval run ${evalRunId}: ${detailResult.error}`,
      );
      return;
    }

    const judgeStep = detailResult.value.steps.find(
      (step) => step.stepId === JUDGE_STEP_ID,
    );
    const scoreExport = judgeStep?.exports?.find(
      (exp) => exp.name === JUDGE_EXPORT_NAME,
    );
    if (!scoreExport) {
      console.error(
        `[eval-result-projection-sink] eval run ${evalRunId} has no "${JUDGE_STEP_ID}.${JUDGE_EXPORT_NAME}" export — nothing to store`,
      );
      return;
    }

    const jsonResult = await this.artifacts.getJson(scoreExport.artifactHash);
    if (!jsonResult.ok) {
      console.error(
        `[eval-result-projection-sink] unable to read score artifact for run ${evalRunId}: ${jsonResult.error.message}`,
      );
      return;
    }

    const parsed = EvalScorePayloadSchema.safeParse(jsonResult.value);
    if (!parsed.success) {
      console.error(
        `[eval-result-projection-sink] eval run ${evalRunId}'s score export failed schema validation: ${parsed.error.message}`,
      );
      return;
    }

    const created = await this.evalResults.createEvalResult({
      targetRunId: state.targetRunId,
      targetStepId: state.targetStepId,
      targetExportName: state.targetExportName,
      evalRunId,
      evalFlowId: state.evalFlowId,
      evalFlowVersionId: state.evalFlowVersionId,
      experimentId: state.experimentId,
      overall: parsed.data.overall,
      passed: parsed.data.passed,
      payload: parsed.data,
    });
    if (!created.ok) {
      console.error(
        `[eval-result-projection-sink] unable to store eval result for run ${evalRunId}: ${created.error}`,
      );
    }
  }
}
