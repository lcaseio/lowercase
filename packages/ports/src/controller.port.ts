export type RuntimeStatus = "stopped" | "running";
export interface ControllerPort {
  startRuntime(): Promise<RuntimeStatus>;
  stopRuntime(): Promise<RuntimeStatus>;
}

export interface ClientControllerPort extends ControllerPort {
  subscribeToChannel<TPayload = unknown>(
    channel: string,
    handler: (payload: TPayload) => void
  ): () => void;
}
export interface ServerControllerPort extends ControllerPort {}
