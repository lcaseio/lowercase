import { ForkSpecIndex } from "@lcase/types";

export interface ForkSpecIndexStorePort {
  init(): Promise<void>;
  put(index: ForkSpecIndex): Promise<void>;
  get(forkSpecIndexId: string): Promise<ForkSpecIndex | undefined>;
  getIndexList(): Promise<string[]>;
  getAll(): Promise<ForkSpecIndex[]>;
}
