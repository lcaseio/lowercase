import { PipeFields } from "./pipe.fields.js";

export type StepCapCommonFields = {
  args?: Record<string, unknown>;
  tool?: string;
};

export type StepOnField = {
  on?: {
    success?: string;
    failure?: string;
  };
};

export type ExportDeclaration = {
  ref: string;
  type: "application/json" | "text/plain" | "text/markdown";
  // JSON Schema, validated only when type is application/json
  schema?: Record<string, unknown>;
};

export type StepExportsField = {
  exports?: Record<string, ExportDeclaration>;
};
