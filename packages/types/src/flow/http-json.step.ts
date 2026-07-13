import {
  ExportDeclaration,
  StepCapCommonFields,
  StepOnField,
} from "./common-fields.js";
import { JsonValue } from "../json-value.js";

export type StepHttpJson = StepCapCommonFields &
  StepOnField & {
    type: "httpjson";
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
    headers?: Record<string, string>;
    body?: JsonValue;
    exports?: Record<string, ExportDeclaration>;
  };
