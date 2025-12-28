import type { JobEventType } from "@lcase/types";
import type { RmToolHandlerPort } from "./tool-handler.port.js";

export interface RmHandlerRegistryPort {
  getHandler(type: JobEventType): RmToolHandlerPort | undefined;
}
