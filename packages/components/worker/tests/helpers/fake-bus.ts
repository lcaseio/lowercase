import { vi } from "vitest";
import type { AnyEvent } from "@lcase/types";
import type { EventBusPort } from "@lcase/ports";

// A genuinely-typed EventBusPort fake, no cast -- modeled on
// packages/events/tests/helpers/mock-bus.ts's pattern, kept package-local
// rather than cross-imported from that package's own test directory.
// Captures every published event for assertions on the compat adapter's
// final emitted shape.
export function createFakeBus() {
  const published: AnyEvent[] = [];
  const publish = vi.fn(async (_topic: string, event: AnyEvent) => {
    published.push(event);
  });
  const subscribe = vi.fn(() => () => undefined);
  const close = vi.fn(async () => undefined);
  const bus: EventBusPort = { publish, subscribe, close };
  return { bus, publish, subscribe, close, published };
}
