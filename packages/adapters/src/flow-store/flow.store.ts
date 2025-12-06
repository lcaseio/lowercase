import { FlowSchema } from "@lcase/specs";
import { FlowDefinition } from "@lcase/types";
export class FlowStore {
  #flows = new Map<string, FlowDefinition>();

  constructor() {}

  add(unvalidatedFlow: FlowDefinition) {
    const { result, flow } = this.validate(unvalidatedFlow);
    if (flow === undefined) return;
    if (result) {
      this.#flows.set(flow.name, flow);
    }
  }

  get(flowName: string): FlowDefinition | false {
    if (!this.#flows.has(flowName)) return false;
    const flow = this.#flows.get(flowName);
    if (flow === undefined) return false;
    return flow;
  }

  validate(flow: FlowDefinition): { result: boolean; flow?: FlowDefinition } {
    if (flow === undefined) return { result: false, flow };
    const result = FlowSchema.safeParse(flow);
    if (!result.success) {
      console.error("[flowDb validate] could not validate flow", flow);
      console.error(JSON.stringify(result.error, null, 2));
      return { result: false };
    }

    return { result: true, flow };
  }
}
