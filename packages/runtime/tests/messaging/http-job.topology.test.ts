import { describe, expect, it } from "vitest";
import {
  engineHttpJobTerminalSubscription,
  httpJobCommandPublication,
  httpJobTerminalPublication,
  observabilityHttpJobCommandSubscription,
  observabilityHttpJobTerminalSubscription,
  workerHttpJobCommandSubscription,
} from "../../src/messaging/http-job.topology.js";

// Four near-identical declarations are exactly where a copy-paste puts the
// engine on the command publication. The completeness of each type list is
// already proven by the compiler; what is worth asserting at runtime is that
// each subscription points at the publication it is named for.
describe("HTTP job topology", () => {
  it("declares one command publication and one terminal publication", () => {
    expect(httpJobCommandPublication).toEqual({
      id: "http-job-command.v1",
      types: ["job.httpjson.submitted"],
    });
    expect(httpJobTerminalPublication).toEqual({
      id: "http-job-terminal.v1",
      types: ["job.httpjson.completed", "job.httpjson.failed"],
    });
  });

  it("subscribes worker and observability to commands, engine and observability to terminals", () => {
    const bound = [
      workerHttpJobCommandSubscription,
      observabilityHttpJobCommandSubscription,
      engineHttpJobTerminalSubscription,
      observabilityHttpJobTerminalSubscription,
    ];

    expect(bound.map((s) => [s.id, s.publication.id])).toEqual([
      ["worker.http-job-command.v1", "http-job-command.v1"],
      ["observability.http-job-command.v1", "http-job-command.v1"],
      ["engine.http-job-terminal.v1", "http-job-terminal.v1"],
      ["observability.http-job-terminal.v1", "http-job-terminal.v1"],
    ]);
    expect(new Set(bound.map((s) => s.id)).size).toBe(bound.length);
  });
});
