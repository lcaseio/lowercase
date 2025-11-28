import { StepCapCommonFields, StepOnField } from "./common-fields.js";

export type StepHttpJson = StepCapCommonFields &
  StepOnField & {
    type: "httpjson";
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
    headers?: Record<string, unknown>;
    body?: Record<string, unknown>;
  };
