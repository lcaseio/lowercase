export type RuntimeStatus = "stopped" | "running";
export interface ControllerPort {
  startRuntime(): Promise<RuntimeStatus>;
  stopRuntime(): Promise<RuntimeStatus>;
}

export interface ClientControllerPort extends ControllerPort {
  subscribeToChannel<TPayload = unknown>(
    channel: string,
    handler: (payload: TPayload) => void,
  ): () => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- deliberate: a nominal marker distinct from ClientControllerPort, no extra members needed yet
export interface ServerControllerPort extends ControllerPort {}
