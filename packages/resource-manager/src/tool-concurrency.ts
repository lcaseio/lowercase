import type { RmToolConcurrencyPort } from "@lcase/ports/rm";
export class ToolConcurrency implements RmToolConcurrencyPort {
  constructor(private readonly map: Map<string, number>) {}

  get(toolId: string): number {
    return this.map.get(toolId) ?? 0;
  }
  increment(toolId: string) {
    this.map.set(toolId, this.get(toolId) + 1);
  }
  decrement(toolId: string) {
    this.map.set(toolId, Math.max(0, this.get(toolId) - 1));
  }
}
