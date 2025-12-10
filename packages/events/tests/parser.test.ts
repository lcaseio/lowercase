import { describe, it, expect } from "vitest";
import { AnyEvent } from "../../types/src";
import { EventParser } from "../src/parsers/event-parser.js";
import { eventRegistry } from "../src/registries/event-registry.js";

describe("parser", () => {
  it("should not throw for parsing valid event payloads", () => {
    const ep = new EventParser(eventRegistry);
    const testEvent1 = {
      id: "",
      source: "",
      specversion: "1.0",
      time: "",
      type: "job.httpjson.submitted",
      data: {
        job: {
          id: "",
          toolid: "httpjson",
          capid: "httpjson",
        },
        pipe: {},
        url: "",
      },
      domain: "job",
      action: "submitted",
      entity: "httpjson",
      traceparent: "",
      traceid: "",
      spanid: "",
      flowid: "",
      runid: "",
      stepid: "",
      jobid: "",
      capid: "httpjson",
      toolid: null,
    } as AnyEvent;

    expect(() => {
      ep.parse(testEvent1, "job.httpjson.submitted");
    }).not.toThrow();
  });
  it("should throw when parsing mismatched event payloads", () => {
    const ep = new EventParser(eventRegistry);
    const testEvent1 = {
      id: "",
      source: "",
      specversion: "1.0",
      time: "",
      type: "job.httpjson.queued",
      data: {
        job: {
          id: "",
          toolid: "httpjson",
          capid: "httpjson",
        },
        pipe: {},
        url: "",
      },
      domain: "job",
      action: "submitted",
      entity: "httpjson",
      traceparent: "",
      traceid: "",
      spanid: "",
      flowid: "",
      runid: "",
      stepid: "",
      jobid: "",
      capid: "httpjson",
      toolid: null,
    } as AnyEvent;

    const e = expect(() => {
      ep.parse(testEvent1, "job.httpjson.submitted");
    }).toThrow();
  });
});
