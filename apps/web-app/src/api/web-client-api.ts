import type { ClientApiPort } from "@lcase/ports";
import type { FlowDefinition, PostJsonFlowRes } from "@lcase/types";

export class WebClientApi implements ClientApiPort {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  async postJsonFlow(json: FlowDefinition): Promise<PostJsonFlowRes> {
    const url = new URL("api/flows", this.baseUrl);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      if (!res.ok) throw new Error("HTTP response returned not ok");
      const data = (await res.json()) as PostJsonFlowRes;
      // later parese with zod or ajv
      return data;
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : `Error fetching ${url}`,
      };
    }
  }
}
