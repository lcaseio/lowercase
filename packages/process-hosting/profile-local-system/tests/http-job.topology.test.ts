import { describe, expect, it } from "vitest";
import {
  engineHttpJobTerminalSubscription,
  httpJobCommandTopic,
  httpJobSubscriptions,
  httpJobTerminalTopic,
  observabilityHttpJobSubscription,
  workerHttpJobCommandSubscription,
} from "../src/http-job.topology.js";

// Near-identical declarations are exactly where a copy-paste puts the engine on
// the command topic. The completeness of each type list is already proven
// by the compiler; what is worth asserting at runtime is that each subscription
// selects the topics it is named for.
describe("HTTP job topology", () => {
  it("declares one command topic and one terminal topic", () => {
    expect(httpJobCommandTopic).toEqual({
      id: "http-job-command.v1",
      types: ["job.httpjson.submitted"],
    });
    expect(httpJobTerminalTopic).toEqual({
      id: "http-job-terminal.v1",
      types: ["job.httpjson.completed", "job.httpjson.failed"],
    });
  });

  it("subscribes worker to commands, engine to terminals, and observability to both", () => {
    const bound = [
      workerHttpJobCommandSubscription,
      engineHttpJobTerminalSubscription,
      observabilityHttpJobSubscription,
    ];

    expect(bound.map((s) => [s.id, s.topics.map((p) => p.id)])).toEqual([
      ["worker.http-job-command.v1", ["http-job-command.v1"]],
      ["engine.http-job-terminal.v1", ["http-job-terminal.v1"]],
      [
        "observability.http-job.v1",
        ["http-job-command.v1", "http-job-terminal.v1"],
      ],
    ]);
    expect(new Set(bound.map((s) => s.id)).size).toBe(bound.length);
    expect(httpJobSubscriptions).toEqual(bound);
  });

  // Recording a Worker job is one purpose, so it is one subscription and one
  // lane. Two would let a terminal be recorded while the command that produced
  // it was still being recorded.
  it("gives observability one subscription spanning both topics, not one each", () => {
    expect(observabilityHttpJobSubscription.topics).toHaveLength(2);
    expect(
      httpJobSubscriptions.filter((s) => s.id.startsWith("observability.")),
    ).toHaveLength(1);
  });
});
