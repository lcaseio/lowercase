import type {
  ClientControllerPort,
  FlowList,
  RuntimeStatus,
} from "@lcase/ports";

export class MockApiClient implements ClientControllerPort {
  subscribeToChannel<TPayload = unknown>(
    channel: string,
    handler: (payload: TPayload) => void,
  ): () => void {
    console.log("channel:", channel);
    console.log("handler", handler);
    return () => {};
  }
  async startFlow(args: {
    absoluteFilePath?: string;
  }): Promise<string | undefined> {
    return `starting flow ${args}`;
  }
  startRuntime(): Promise<RuntimeStatus> {
    throw new Error("Method not implemented.");
  }
  stopRuntime(): Promise<RuntimeStatus> {
    throw new Error("Method not implemented.");
  }
  async listFlows(args: { absoluteDirPath?: string }): Promise<FlowList> {
    console.log(`listFlows called with args ${args}`);
    const list: FlowList = {
      validFlows: {},
      invalidFlows: {},
    };
    return list;
  }
  async getFlowDir?(): Promise<string> {
    console.log("getting flow dir");
    return "fake/dir";
  }
}
