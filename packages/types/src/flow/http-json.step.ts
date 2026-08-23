import type {
  ExportDeclaration,
  StepCapCommonFields,
  StepOnField,
} from "./common-fields.js";
import type { ShallowJsonValue } from "../json-value.js";

export type StepHttpJson = StepCapCommonFields &
  StepOnField & {
    type: "httpjson";
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
    headers?: Record<string, string>;
    body?: ShallowJsonValue;
    exports?: Record<string, ExportDeclaration>;
  };
