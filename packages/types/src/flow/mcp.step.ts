import { PipeFields } from "./pipe.fields.js";

export type StepMcp = {
  type: "mcp";
  url: string;
  transport: "sse" | "stdio" | "streamable-http" | "http";
  feature: {
    primitive:
      | "resource"
      | "prompt"
      | "tool"
      | "sampling"
      | "roots"
      | "elicitation";
    name: string;
  };
  pipe?: PipeFields;
  args?: Record<string, unknown>;
};
