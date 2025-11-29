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
  payload: Record<string, unknown>;
};

export type ToolFailedData = ToolDescriptorData & {
  reason: string;
  status: ToolStatusString;
  payload?: Record<string, unknown>;
};

export type ToolStatusString = "success" | "failure";
