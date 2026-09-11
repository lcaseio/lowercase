import type {
  DeliveredMessage,
  ReportDeliveryFailure,
} from "../delivery.types.js";

// Re-exported so the mailbox's own importers keep one import site, while the
// definitions live where both carriers can reach them.
export type {
  DeliveredMessage,
  DeliveryFailure,
  ReportDeliveryFailure,
} from "../delivery.types.js";

export type SubscriptionMailboxDeps = {
  subscriptionId: string;
  invoke: (message: DeliveredMessage) => Promise<void>;
  maxInFlight: number;
  reportFailure: ReportDeliveryFailure;
  /** Router bookkeeping: one settled delivery, success or failure. */
  onSettled: () => void;
};

/**
 * One logical subscription's private FIFO queue and processing loop.
 *
 * Runtime-private by design: it is never handed to a component and is not a
 * port. A component sees only its handler being called.
 *
 * Unbounded on purpose for now -- bounded capacity needs an overflow policy
 * that does not deadlock cyclic publication, which is separate design work.
 * Process memory is the only limit, and a sustained producer/consumer mismatch
 * will find it.
 */
export class SubscriptionMailbox {
  readonly #queue: DeliveredMessage[] = [];
  readonly #deps: SubscriptionMailboxDeps;
  #inFlight = 0;
  #scheduled = false;

  constructor(deps: SubscriptionMailboxDeps) {
    this.#deps = deps;
  }

  enqueue(message: DeliveredMessage): void {
    this.#queue.push(message);
    this.#schedule();
  }

  // Dispatch is always deferred, never run inside the caller's stack. That is
  // what keeps a chain like engine publishes -> worker handles -> worker
  // publishes -> engine handles from re-entering the engine inside the
  // original publish() call.
  #schedule(): void {
    if (this.#scheduled) return;
    if (this.#queue.length === 0) return;
    if (this.#inFlight >= this.#deps.maxInFlight) return;

    this.#scheduled = true;
    queueMicrotask(() => {
      this.#scheduled = false;
      this.#pump();
    });
  }

  #pump(): void {
    while (this.#queue.length > 0 && this.#inFlight < this.#deps.maxInFlight) {
      const message = this.#queue.shift();
      if (!message) return;
      this.#inFlight += 1;
      void this.#deliver(message);
    }
  }

  async #deliver(message: DeliveredMessage): Promise<void> {
    try {
      await this.#deps.invoke(message);
    } catch (error) {
      // One reported attempt, then the delivery is dropped. No retry: retrying
      // before handler side effects are known to be idempotent would turn one
      // failure into repeated external work.
      this.#report(message, error);
    } finally {
      this.#inFlight -= 1;
      this.#schedule();
      this.#deps.onSettled();
    }
  }

  #report(message: DeliveredMessage, error: unknown): void {
    try {
      this.#deps.reportFailure({
        subscriptionId: this.#deps.subscriptionId,
        messageId: message.id,
        messageType: message.type,
        source: message.source,
        error,
      });
    } catch {
      // A failing reporter must never take the processing loop down with it.
    }
  }
}
