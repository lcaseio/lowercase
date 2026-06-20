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

export type StepExportsField = {
  exports?: Record<string, string>;
};
