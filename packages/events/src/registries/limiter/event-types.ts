import type { LimiterEventType } from "@lcase/types";

export const limiterEventTypes = [
  "limiter.started",
  "limiter.stopped",
  "limiter.slot.denied",
  "limiter.slot.granted",
] as const satisfies LimiterEventType[];

type MissingLimiterTypes = Exclude<
  LimiterEventType,
  (typeof limiterEventTypes)[number]
>;
type _ListsAllLimiterTypes = MissingLimiterTypes extends never ? true : never;
const _checkEventTypes: _ListsAllLimiterTypes = true;
