import { FlowStorePort } from "@lcase/ports";

export class FlowStoreSqlite implements FlowStorePort {
  readFlow(args: { filePath?: string }): string | undefined {
    throw new Error("Method not implemented.");
  }
  readFlows(args: { dir?: string }): Map<string, unknown> {
    throw new Error("Method not implemented.");
  }
}
