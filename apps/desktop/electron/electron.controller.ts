import { ClientControllerPort, RuntimeStatus } from "@lcase/ports";

// TODO: implement type mapping on API invoke channels
export class ElectronController implements ClientControllerPort {
  private get api() {
    if (!window.electronAPI) {
      throw new Error("[electron-controller-client] no electronAPI on window");
    }
    return window.electronAPI;
  }
  async startRuntime(): Promise<RuntimeStatus> {
    console.log("[electron-controller-client] startRuntime() invoked");
    const result = await this.api.invoke("controller:startRuntime", {});

    if (result === "running") return "running";
    return "stopped";
  }
  async stopRuntime(): Promise<RuntimeStatus> {
    const result = await this.api.invoke("controller:stopRuntime", {});

    if (result === "stopped") return "stopped";
    return "running";
  }

  // returns unsubscribe function
  subscribeToChannel<TPyaload = unknown>(
    channel: string,
    handler: (payload: TPyaload) => void
  ): () => void {
    return this.api.on(channel, (_event, payload: TPyaload) => {
      handler(payload);
    });
  }
}
