import type { ForkSpec } from "../engine/fork-spec.type.js";
import type { FlowRecord, FlowVersionRecord } from "./flow-record.js";

export type SimRecord = {
  id: string;
  name: string;
  description?: string;
  flowId: string;
  flowVersionId: string;
  forkSpecHash: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSimRecordInput = {
  name: string;
  description?: string;
  flowId: string;
  flowVersionId: string;
  forkSpecHash: string;
};

export type SimListItem = {
  sim: SimRecord;
  flow: FlowRecord;
  flowVersion: FlowVersionRecord;
};

export type SimDefinition = {
  sim: SimRecord;
  spec: ForkSpec;
};
