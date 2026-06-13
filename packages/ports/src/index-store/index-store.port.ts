import type {
  ArtifactIndex,
  FlowIndex,
  ForkSpecIndex,
  Result,
  RunIndex,
} from "@lcase/types";

// data structures of the json index files
export type AnyIndex = ForkSpecIndex | FlowIndex | ArtifactIndex | RunIndex;

export interface IndexStorePort<Index extends AnyIndex> {
  init(): Promise<void>;
  put(id: string, value: Index): Promise<Result<string, string>>;
  get(id: string): Promise<Index | undefined>;
  getIdList(): Promise<string[]>;
  getAll(): Promise<Index[]>;
}
