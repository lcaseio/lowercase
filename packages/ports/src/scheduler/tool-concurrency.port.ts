export interface RmToolConcurrencyPort {
  get(toolId: string): number;
  increment(toolId: string): void;
  decrement(toolId: string): void;
}
