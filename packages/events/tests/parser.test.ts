import { describe, it, expect } from "vitest";
import { AnyEvent } from "../../types/src";
import { eventParser } from "../src/parser/parser.js";

describe("parser", () => {
  it("should not throw for parsing valid event payloads", () => {
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
      eventParser(testEvent1, "job.httpjson.submitted");
    }).not.toThrow();
  });
  it("should throw when parsing mismatched event payloads", () => {
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
      eventParser(testEvent1, "job.httpjson.submitted");
    }).toThrow();
  });
});
