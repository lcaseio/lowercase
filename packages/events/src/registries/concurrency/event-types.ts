import type { ConcurrencyEventType } from "@lcase/types";

export const concurrencyEventTypes = [
  "concurrency.started",
  "concurrency.stopped",
  "concurrency.tool.denied",
  "concurrency.tool.granted",
] as const satisfies ConcurrencyEventType[];

type MissingConcurrencyTypes = Exclude<
  ConcurrencyEventType,
  (typeof concurrencyEventTypes)[number]
>;
type _ListsAllConcurrencyTypes = MissingConcurrencyTypes extends never
  ? true
  : never;
const _checkEventTypes: _ListsAllConcurrencyTypes = true;
