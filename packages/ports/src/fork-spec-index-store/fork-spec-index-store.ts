import type { ForkSpecIndex, Result } from "@lcase/types";

export interface ForkSpecIndexStorePort {
  init(): Promise<void>;
  put(index: ForkSpecIndex): Promise<Result<ForkSpecIndex, string>>;
  get(forkSpecIndexId: string): Promise<ForkSpecIndex | undefined>;
  getIndexList(): Promise<string[]>;
  getAll(): Promise<ForkSpecIndex[]>;
}
