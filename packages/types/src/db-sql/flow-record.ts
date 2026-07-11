export type FlowRecord = {
  id: string;
  name: string;
  description?: string;
  kind: "business" | "eval";
  createdAt: string;
  updatedAt: string;
};

export type FlowVersionRecord = {
  id: string;
  flowId: string;
  sequence: number;
  definitionHash: string;
  versionLabel?: string;
  description?: string;
  createdAt: string;
};

export type CreateFlowRecordInput = {
  name: string;
  description?: string;
  kind?: "business" | "eval";
  definitionHash: string;
  versionLabel?: string;
  versionDescription?: string;
};

export type CreateFlowRecordResult = {
  flow: FlowRecord;
  version: FlowVersionRecord;
};
