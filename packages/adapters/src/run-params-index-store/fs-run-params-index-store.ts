// import type { RunParamsIndexStorePort } from "@lcase/ports";
// import type { Result, RunParams } from "@lcase/types";
// import { FsJsonIndexStore } from "../generic-store/fs-json-index-store.js";

// export class FsRunParamsIndexStore implements RunParamsIndexStorePort {
//   private store: FsJsonIndexStore<RunParams>;

//   constructor(
//     dir: string,
//     store: FsJsonIndexStore<RunParams> = new FsJsonIndexStore<RunParams>({
//       dir,
//       extension: ".index.json",
//     }),
//   ) {
//     this.store = store;
//   }

//   async init(): Promise<void> {
//     await this.store.init();
//   }

//   async putRunParams(
//     runId: string,
//     params: RunParams,
//   ): Promise<Result<string, string>> {
//     return this.store.put(runId, params);
//   }

//   async getRunParams(runId: string): Promise<RunParams | undefined> {
//     return this.store.get(runId);
//   }

//   async getAllRunIds(): Promise<string[]> {
//     return this.store.getIdList();
//   }
// }
