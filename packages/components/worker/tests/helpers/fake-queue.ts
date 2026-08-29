import type { QueuePort } from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";

type Waiter = { workerId: string; resolve: (event: AnyEvent | null) => void };

// A genuinely-typed QueuePort fake, no cast -- mirrors InMemoryQueue's real
// reserve-parks-a-promise-when-empty behavior so the lane/backpressure tests
// exercising this fake are meaningful, not just trivially green.
export function createFakeQueue() {
  const queues = new Map<string, AnyEvent[]>();
  const waiters = new Map<string, Waiter[]>();

  const queue: QueuePort = {
    async enqueue(name, event) {
      const parked = waiters.get(name) ?? [];
      const waiter = parked.shift();
      if (waiter) {
        waiter.resolve(event);
        return;
      }
      const q = queues.get(name) ?? [];
      q.push(event);
      queues.set(name, q);
    },
    async dequeue(name) {
      const q = queues.get(name) ?? [];
      return q.shift();
    },
    reserve(name, workerId) {
      const q = queues.get(name) ?? [];
      const next = q.shift();
      if (next) return Promise.resolve(next);
      return new Promise<AnyEvent | null>((resolve) => {
        const parked = waiters.get(name) ?? [];
        parked.push({ workerId, resolve });
        waiters.set(name, parked);
      });
    },
    async ack() {},
    async nack() {},
    async peek(name, count) {
      return (queues.get(name) ?? []).slice(0, count);
    },
    abortAllForWorker(workerId) {
      for (const [name, parked] of waiters.entries()) {
        const remaining = parked.filter((w) => {
          if (w.workerId !== workerId) return true;
          w.resolve(null);
          return false;
        });
        waiters.set(name, remaining);
      }
    },
    abortAll() {
      for (const parked of waiters.values()) {
        for (const w of parked) w.resolve(null);
      }
      waiters.clear();
    },
  };

  return {
    queue,
    // Test-only helper: number of events still sitting in a queue lane,
    // untouched by any reserve() call.
    depth(name: string): number {
      return (queues.get(name) ?? []).length;
    },
  };
}
