import { vi } from "vitest";
import type {
  ProtocolExecutor,
  ProtocolResult,
} from "../../../src/v2/protocol/protocol-executor.types.js";
import type { ProtocolRequest } from "../../../src/v2/job.contracts.js";

export function createFakeProtocolExecutor(
  resultFn: (
    request: ProtocolRequest,
  ) => ProtocolResult | Promise<ProtocolResult>,
) {
  const execute = vi.fn(async (request: ProtocolRequest) => resultFn(request));
  const executor: ProtocolExecutor = { execute };
  return { executor, execute };
}
