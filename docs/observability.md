# Oservability Event Docs

Updated for `v0.1.0-alpha.7`

## Status

This is draft of a specification in an attempt to align event envelopes with Cloud Events and OpenTelemetry. Some design aspects are not yet implemented but documented for future use.

## Cloud Events + OpenTelemetry Conventions

A single practical spec for emitting lifecycle and domain events that correlate cleanly across traces, spans, logs, and metrics.

### 01. Design Goals

- Human friendly readable event types + machine friendly attributes that fit Cloud Events flat structure, easy to analyze
- Otel aligned span attributes and W3C Trace Context propagation for Cloud Events (`traceparent` & `tracestate`)
- Structured data payloads in `data`, low cardinality attributes in base event

### 02. Cloud Events Envelope

#### Required Cloud Events standard attributes:

- `specversion`
- `id`
- `source`
- `type` (human readable stable taxonomy, important for current type system)
- `data` (domain payload)

#### lowercase / Otel Extension Attributes

- `traceparent` W3C Trace Context
- `tracestate` optional W3C trace state
- `traceid`
- `domain` (lowercase bounded set)
- `entity` (lowercase bounded set)
- ids (optional per scope, references to lowercase values) - `flowid`, `runid`, `stepid`, `jobid`, `toolid`, `steptype`, `capid`

### 03. Vocabulary

#### `domain` (lifecycle base event type)

- `engine`
- `worker`
- `flow`
- `step`
- `tool`
- `router`
- `stream`
- `cli`
- `job`
- `system`

#### `action` (lifecycle verbs)

Prefer one word verbs, past tense.

- `queued`
- `started`
- `stopped` (for components like engine that have start/stop behavior)
- `completed` (for jobs or processes)
- `failed`
- `canceled`
- `retried`
- `timeout`
- `emitted`
- `received`
- `entered`
- `exited`
- `registered`
- `requested`
- `saved`
- `logged`
- `submitted`
- `delayed`

#### `entity` (classification of work)

Optional map to **lowercase** capabilities or domain entities

- `mcp`
- `httpjson`
- `registration`

### 04. Event `type` should be human readable even if redundant

Example:

- type `job.mcp.queued` for human readable type, but also emit attributes for otel
- maps to `domain=job`, `entity=mcp`, `action=queued`

This maps well to TypeScript data payload per type, and human readable types, while still providing open telemetry attributes to sort events. Redundant but helpful.

May move to simple event types later if redundancy is a performance problem or bad DX, or if the internal type system needs that refinement.

### 05. Tracing model (OpenTelemetry aligned)

Trace is a full flow run `flow.submitted` to `flow.completed` or `flow.failed`)

#### Nested Spans

- `flow` (root)
- `step` (child of flow)
- `job` (child of step)
- `tool` (child of job)
- queue / router (could be modeled as PRODUCER/CONSUMER spans, but local work as INTERNAL)
