import type { StepCapCommonFields, StepOnField } from "./common-fields.js";

export type StepMcp = StepCapCommonFields &
  StepOnField & {
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
  };
