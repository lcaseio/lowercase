import type { AnyEvent } from "@lcase/types";
import type { EventStore } from "@lcase/ports/event-store";
import fs, { WriteStream } from "fs";
import path from "path";
import readline from "readline";

type RunScopedEvent = AnyEvent & { runid: string };

export class JsonlEventLog implements EventStore {
  private writeStreams = new Map<string, WriteStream>();

  constructor(public dir: string) {}

  async getEvent(eventId: string) {
    return {} as AnyEvent;
  }

  async recordEvent(
    event: AnyEvent,
    runId?: string
  ): Promise<boolean | undefined> {
    runId = runId ?? (this.hasRunId(event) ? event.runid : undefined);
    if (!runId) return;

    const writeStream = this.getWriteStream(runId);

    try {
      // TODO: later handle situations where the node internal buffer is
      // full.  at that point, we need an internal queue that then flushes
      // in some way at some point, and either persist it or keep it in memory.
      // but at some point node's internal buffer overrun might be something
      // to look at.
      return writeStream.write(JSON.stringify(event) + "\n");
    } catch (err) {
      throw new Error(`could not write  event ${event}: error:${err}`);
    }
  }

  async *iterateAllEvents(runId: string): AsyncGenerator<AnyEvent> {
    const stream = fs.createReadStream(this.getFilePath(runId));
    const rl = readline.createInterface({ input: stream });

    try {
      for await (const line of rl) {
        if (!line.trim()) continue;
        yield JSON.parse(line) as AnyEvent;
      }
    } catch (err) {
      throw new Error("unable to read file");
    } finally {
      rl.close();
      stream.close();
    }
  }

  getFilePath(runId: string) {
    const fileName = `${runId}.events.jsonl`;
    return path.join(this.dir, fileName);
  }

  getWriteStream(runId: string): WriteStream {
    const writeStream = this.writeStreams.get(runId);
    if (!writeStream) return this.setWriteStream(runId);
    return writeStream;
  }

  setWriteStream(runId: string): WriteStream {
    const stream = fs.createWriteStream(this.getFilePath(runId), {
      flags: "a",
      encoding: "utf8",
      autoClose: true,
    });
    this.writeStreams.set(runId, stream);
    return stream;
  }

  stopRecording(runId: string) {
    const writeStream = this.getWriteStream(runId);
    if (!writeStream) return;
    writeStream.close();
  }

  /**
   * Returns true if the event has a runId, false if not.
   * The return type predicate narrows the type to a RunScoped event, meaning
   * and event with a runid property;
   * @param event AnyEvent
   * @returns boolean
   */
  hasRunId(event: AnyEvent): event is RunScopedEvent {
    const e = event as unknown as Record<string, unknown>;
    return typeof e.runid === "string";
  }
}
