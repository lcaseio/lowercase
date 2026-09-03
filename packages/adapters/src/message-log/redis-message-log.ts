import type {
  ClaimPendingOptions,
  ConsumerGroupOptions,
  MessageLogEntry,
  MessageLogPort,
  ReadGroupOptions,
} from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";
import type { RedisClientType } from "redis";

// Envelope travels as a single JSON field rather than flattened across
// Redis's native field-value pairs -- AnyEvent's shape is nested (data,
// scope fields, otel fields) and Redis stream fields are flat strings, so
// flattening would need its own lossy encode/decode scheme for no real
// benefit over one opaque field.
const PAYLOAD_FIELD = "payload";

// A reserved internal group used only so ensureStream can provision a
// stream (MKSTREAM) without requiring a real consumer group to exist yet --
// nothing ever reads through it.
const ENSURE_STREAM_GROUP = "__ensure_stream__";

function isBusyGroupError(e: unknown): boolean {
  return e instanceof Error && e.message.includes("BUSYGROUP");
}

function decodeEntry(
  id: string,
  message: Record<string, string>,
): MessageLogEntry {
  return { id, message: JSON.parse(message[PAYLOAD_FIELD]) as AnyEvent };
}

// Built against Redis Streams' real distributed protocol (XADD, XREADGROUP,
// XACK, XAUTOCLAIM) -- not the passive claim/reserve shape QueuePort has,
// and not EventBusPort's fire-and-forget in-process delivery. See
// docs/initiatives/swappable-infrastructure/arcs/queue-adapter.md's PR 4
// discussion for why this is its own port rather than an adapter for
// either of those.
export class RedisMessageLog implements MessageLogPort {
  constructor(private readonly client: RedisClientType) {}

  async ensureStream(stream: string): Promise<void> {
    try {
      await this.client.xGroupCreate(stream, ENSURE_STREAM_GROUP, "$", {
        MKSTREAM: true,
      });
    } catch (e) {
      if (!isBusyGroupError(e)) throw e;
    }
  }

  async ensureConsumerGroup(
    stream: string,
    group: string,
    options: ConsumerGroupOptions,
  ): Promise<void> {
    try {
      await this.client.xGroupCreate(
        stream,
        group,
        options.startAt === "beginning" ? "0" : "$",
        { MKSTREAM: true },
      );
    } catch (e) {
      if (!isBusyGroupError(e)) throw e;
    }
  }

  async publish(stream: string, message: AnyEvent): Promise<string> {
    return this.client.xAdd(stream, "*", {
      [PAYLOAD_FIELD]: JSON.stringify(message),
    });
  }

  async readGroup(
    stream: string,
    group: string,
    consumer: string,
    options: ReadGroupOptions,
  ): Promise<MessageLogEntry[]> {
    const reply = await this.client.xReadGroup(
      group,
      consumer,
      { key: stream, id: ">" },
      { COUNT: options.batchSize, BLOCK: options.blockMs },
    );
    if (!reply) return [];
    return reply.flatMap((s) =>
      s.messages.map((m: { id: string; message: Record<string, string> }) =>
        decodeEntry(m.id, m.message),
      ),
    );
  }

  async ack(stream: string, group: string, ids: string[]): Promise<void> {
    await this.client.xAck(stream, group, ids);
  }

  async claimPending(
    stream: string,
    group: string,
    consumer: string,
    options: ClaimPendingOptions,
  ): Promise<MessageLogEntry[]> {
    const { messages } = await this.client.xAutoClaim(
      stream,
      group,
      consumer,
      options.minIdleMs,
      "0",
      { COUNT: options.count },
    );
    return messages
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .map((m) => decodeEntry(m.id, m.message));
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
