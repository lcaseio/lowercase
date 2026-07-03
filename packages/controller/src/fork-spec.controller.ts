import type {
  ArtifactsPort,
  EmitterFactoryPort,
  RunQueryPort,
} from "@lcase/ports";
import { startForkedSim } from "@lcase/run-flow";

export class ForkSpecController {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly ef: EmitterFactoryPort,
    private readonly runQuery: RunQueryPort,
  ) {}

  async runForkedSim(
    parentRunId: string,
    reuseSteps: string[],
    source: string,
  ) {
    const parentRun = await this.runQuery.getRunDetail(parentRunId);
    if (!parentRun.ok) {
      console.log("error getting parent run detail from sql");
      return;
    }

    const { run } = parentRun.value;
    if (!run.flowId || !run.flowVersionId) {
      console.log("error getting relational flow metadata from parent run");
      return;
    }
    await startForkedSim(
      {
        flowId: run.flowId,
        flowVersionId: run.flowVersionId,
        flowDefHash: run.flowDefHash,
      },
      parentRunId,
      reuseSteps,
      source,
      {
        ef: this.ef,
        artifacts: this.artifacts,
      },
    );
  }
}
