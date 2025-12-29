import type { ThrottlerEventType } from "@lcase/types";

export const throttlerEventTypes = [
  "throttler.started",
  "throttler.stopped",
  "throttler.tool.denied",
  "throttler.tool.granted",
] as const satisfies ThrottlerEventType[];

type MissingThrottlerTypes = Exclude<
  ThrottlerEventType,
  (typeof throttlerEventTypes)[number]
>;
type _ListsAllThrottlerTypes = MissingThrottlerTypes extends never
  ? true
  : never;
const _checkEventTypes: _ListsAllThrottlerTypes = true;
