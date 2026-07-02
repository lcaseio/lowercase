import type {
  CreateSimRecordInput,
  Result,
  SimListItem,
  SimRecord,
} from "@lcase/types";

export interface SimRepositoryPort {
  createSim(input: CreateSimRecordInput): Promise<Result<SimRecord, string>>;
  getSim(simId: string): Promise<Result<SimRecord, string>>;
  listSims(): Promise<SimRecord[]>;
  listSimsWithFlowVersion(): Promise<SimListItem[]>;
  getSimForkSpecHash(simId: string): Promise<Result<string, string>>;
}
