import { JsonSimpleValue } from "../../json-simple-value.js";

export type ToolDescriptorData = {
  tool: {
    id: string;
    name: string;
    version: string;
  };
};

export type ToolStartedData = ToolDescriptorData & {
  log: string;
};

export type ToolCompletedData = ToolDescriptorData & {
  status: ToolStatusString;
  payload?: JsonSimpleValue;
};

export type ToolFailedData = ToolDescriptorData & {
  reason: string;
  status: ToolStatusString;
  payload?: JsonSimpleValue;
};

export type ToolStatusString = "success" | "failure";
