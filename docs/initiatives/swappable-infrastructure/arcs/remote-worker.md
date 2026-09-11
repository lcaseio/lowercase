# Prove Swappable Infrastructure Initiative — Arc: Remote Worker (Changes C19–C22)

**Previous:** [SQL Adapter](./sql-adapter.md) (Changes C15–C18)

Part of the [`INITIATIVE.md`](../INITIATIVE.md) Change log. This Arc turns the
carrier-swap proof into the process-boundary proof the Initiative exists to
reach: Engine and Worker run as separate deployable applications while keeping
one Message protocol and shared durable infrastructure. It builds directly on
the carrier work in the [Queue Adapter Arc](./queue-adapter.md).

The existing HTTP JSON Message path is intentionally a minimum vertical slice.
It proves that the component boundary can stay unchanged when delivery moves
from in-process mailboxes to Redis Streams, but the `local-system` profile still
constructs Engine, Worker, and every handler in one process. This Arc first
separates the package responsibilities that would otherwise make a Worker
deployable install the whole system, then separates deployment topology from
process-local bindings, gives Worker truthful lifecycle and ingress control,
and finally runs the two roles apart.

The four Changes below are the current best review seams, not a quota. Before
each Change starts, its expected moved and changed lines should be inventoried.
If one is too large to review comfortably, split it at the named responsibility
boundary and renumber the unstarted work. Do not preserve a four-Change plan by
combining unrelated behavior or by hiding a large mechanical move inside a
semantic Change.

## Target shape

Four scopes must remain distinct:

- The **system** is the complete product, including all application processes
  and shared infrastructure.
- A **deployment definition** declares the supported process roles, shared
  protocol topology, physical routes, and infrastructure configuration.
- A **process profile** constructs and validates one process's local object
  graph and binds only the handlers that process hosts.
- An **app** is one deployable executable. It loads configuration, creates its
  process profile, and owns signals, readiness, exit behavior, and packaging.

A deployment where every behavioral component runs elsewhere is therefore not
an "empty profile." It is a deployment definition plus the real process
profiles it names. If an API gateway or application-services process remains,
that process has its own profile even when it hosts neither Engine nor Worker.

The target package ownership is equally narrow:

- `@lcase/assembly` owns `ManagedResource` and generic ordered lifecycle,
  rollback, health, and shutdown mechanics. It imports no application
  components or concrete adapters.
- `@lcase/message-router` owns generic
  in-process and log-backed router hosting, mailbox machinery, and topology
  compilation or validation that is independent of a product profile. Its
  log-backed code depends on `MessageLogPort`, not a concrete Redis client.
- `@lcase/profile-local-system` owns
  the complete embedded graph, its supported concrete providers, and
  `assembleEmbeddedSystem()`. It exists because HTTP server and CLI both use
  that graph.
- Shared product protocol declarations and the supported remote deployment
  manifest live in a dependency-clean package or deployment-owned config; they
  import no concrete process graph. C20 chooses the exact home after the second
  host makes the shared surface concrete, but process profiles must not copy
  these identities independently.
- `apps/worker-host` owns its initial Worker-host profile because only that app
  uses it. Promotion is justified only by a second real app that needs the same
  composition policy.

`@lcase/runtime` does not retain a special architectural meaning. If moving the
responsibilities above leaves it empty, remove it. Renaming the existing broad
package without narrowing its dependency closure would not achieve the goal.

Messaging topology has three corresponding static layers:

1. A **protocol catalog** defines stable publication and logical-subscription
   identities and their exact Message types.
2. A **deployment manifest** selects the catalog entries used by one deployment
   and maps them to physical carrier routes.
3. A **process host plan** selects that process role's publishers and
   subscriptions and binds its local handlers.

The deployment compiler can reject an enabled subscription assigned to no
process role. A process profile can reject a subscription assigned to that host
without a local handler. Neither can prove that another process is running;
remote liveness belongs to deployment health and operations. This replaces a
non-enforceable `remote: true` option with explicit ownership.

A publication represents a durable delivery conversation, not mechanically one
event type, mailbox, topic, or Redis stream. The current HTTP JSON command and
terminal outcomes are the first Worker-job conversation. Future job protocols,
including MCP if its semantics fit, can extend that catalog without creating a
stream per lifecycle event.

Observability is one logical subscription over the explicit publications it
records. Locally, its selected Messages should enter one serial ingestion lane
so their observed order can settle consistently instead of being divided among
per-event mailboxes. The desired remote shape likewise permits one ordered
physical observation route, but this Arc does not pretend the mechanics are
already decided: Redis consumer groups are scoped to individual streams, a
multi-stream read does not create global order, and admitting one occurrence to
both work and observation routes requires an atomic-write or reconciliation
policy. Those questions stay visible and must not be accidentally frozen by the
minimum Worker slice.

## Change C19 - Separate assembly, message-router, and local-system profile ownership - in review

### Discussion

This Change is a behavior-preserving package-boundary move. The current
`packages/runtime` contains roughly 4,200 TypeScript lines across source and
tests, so the line count may look large even when most edits are moves. Review
size should be assessed from rename-aware diff statistics and the amount of
changed behavior, not raw additions and deletions alone. If the real inventory
still exceeds a comfortable review, split lifecycle extraction from messaging
and profile extraction before implementation begins.

Move responsibilities to the nearest demonstrated owner:

- create `@lcase/assembly` for generic managed-resource types and lifecycle;
- create `@lcase/message-router` for generic routers, mailboxes,
  log-backed hosting through `MessageLogPort`, and reusable topology checks;
- create `@lcase/profile-local-system` for configuration, provider builders,
  the complete embedded graph, and `assembleEmbeddedSystem()`;
- repoint `apps/http-server` and `apps/cli` at the shared local-system profile;
  and
- remove `@lcase/runtime` if no coherent responsibility remains.

The Change must not alter which components the existing apps host, which
providers their three config axes select, how their Messages are routed, or the
order and guarantees of lifecycle operations. Existing unit, integration, and
end-to-end checks move with their owners and remain green for both messaging
carriers and both SQL and artifact-store branches.

The current protocol declarations may move with the local-system profile
temporarily if it is still their only honest owner. C20 is where a second host
creates evidence for promoting shared protocol and deployment declarations.
This avoids designing a supposedly generic package around one product topology
while still preventing generic router code from depending on the whole profile.

Do not split `@lcase/adapters` pre-emptively in this Change. A Worker host is
expected to need its Redis Streams, S3, and Postgres implementations, so the
present grouping may not inflate that artifact materially. C22 must inspect the
actual deployable dependency closure; only observed unrelated dependencies are
evidence for a further package split.

**Inventory, measured 2026-09-10 before starting.** The 4,197 lines split by
owner as follows, and the conclusion is that this can stay one Change: the
dependency cut already exists in the source tree, so the work is relocation plus
package scaffolding rather than untangling.

| Owner                | Approx lines |
| -------------------- | ------------ |
| Generic assembly     | 370          |
| Generic messaging    | 2,070        |
| Local-system profile | 1,740        |

- **`src/messaging` imports only `@lcase/types` and `@lcase/ports`** besides its
  own siblings. Nothing there reaches into `config`, `profiles`, or `worker`, so
  the largest slice is a straight lift.
- **The generic assembly kernel imports nothing but its own siblings.** The one
  file in that directory reaching outward is `assemble-embedded-system.ts`, which
  ADR-0008 already assigns to the profile. The import graph confirms that
  assignment rather than it being a matter of taste.
- **The product-shaped tests go with the profile, not with messaging.** The two
  HTTP-job slice tests and `tests/helpers/http-job-graph.ts` import Engine,
  Worker, and the observability tap; they move alongside `http-job.topology.ts`.
  Leaving them in the generic package would put exactly the three components its
  completion evidence disclaims into that package's test dependencies. Dev
  dependencies do not ship, so this is about what the package is for rather than
  about deployability.
- **Extract assembly first and get it green before touching messaging.** It is
  370 lines with no dependencies, so any friction in the new package scaffolding
  surfaces on the cheap one instead of inside the large move.

**Completion evidence.**

- Package dependency direction makes `@lcase/assembly` and generic messaging
  installable without Engine, Worker, application services, Observability,
  Replay, Limiter, or concrete adapters.
- The HTTP server and CLI still compose the same `local-system` graph through
  the new profile package.
- `@lcase/runtime` is gone, or any retained package has one explicitly named
  responsibility that is not already owned elsewhere.
- Workspace build, typecheck, lint, unit, and relevant integration suites are
  green, with one existing flow exercised over both in-process and Redis
  carriers.

### What actually landed

`@lcase/runtime` is gone. Three packages replaced it under a new
`packages/process-hosting/` folder, and the two generic ones have **no
production dependencies at all** -- not a short list, an empty one.
`pnpm list --prod --depth=Infinity` returns nothing for either. That is the
claim this Change existed to make, and it is checkable rather than asserted.

The folder is organizational, the same way `packages/components/` is: it gives
the packages involved in composing and running one process a home, and it is
where a Worker-host profile lands in C22 rather than sitting beside unrelated
domain packages.

| Package                       | Lines | Production dependencies |
| ----------------------------- | ----- | ----------------------- |
| `@lcase/assembly`             | 383   | none                    |
| `@lcase/message-router`       | 2,095 | none                    |
| `@lcase/profile-local-system` | 1,767 | 16                      |

- **The inventory held, and no behavior changed.** Every edit was a move, an
  import specifier, or new package scaffolding. The three risks named before
  starting -- Turborepo's task graph, `tsconfig.base.json` depth, and the profile
  test's working-directory assumption -- all turned out to be non-events.
- **Every real problem was the same one: tests that moved up a directory level.**
  Four files kept a `../` that had been correct at the old nesting and pointed
  one level too high at the new one. The compiler caught all four. Worth knowing
  because it is the only class of error a rename-aware diff will not show as
  suspicious.
- **`@lcase/message-router` needed no `redis` dependency, as predicted.** The
  log-backed router already took a factory for its log and named only
  `MessageLogPort`; the concrete client is still constructed on the profile side.
  The property the arc asks for was already true and only had to survive the
  move.
- **`assembleEmbeddedSystem` moving to the profile was the one non-mechanical
  call, and the import graph made it.** It names the router type and the portable
  SQL client, so it could not have come to a dependency-clean assembly package
  without dragging both behind it. ADR-0008 had already assigned it there;
  the imports confirmed the assignment rather than the other way round.
- **The worker's architecture test kept its meaning.** It banned `@lcase/runtime`
  by name, which would have become an inert entry for a package that no longer
  exists. It now bans the two new package names instead.
- **Verification.** Workspace `build` 28/28, `typecheck` 27/27, `lint` 27/27,
  unit `test` 26/26, integration green across all three packages, prettier clean.
  A two-step flow with a param and a chained export ran end to end through
  `apps/http-server` on the default branches, and the Redis vertical slice still
  passes, which covers the other carrier.

## Change C20 - Separate deployment topology from process host bindings - not started

### Discussion

The current `MessageRouterTopology` is sufficient while one profile declares
the full subscription graph and binds every handler. It cannot honestly
describe a distributed deployment: either the Worker process would need
Engine and Observability handlers it does not host, or a locally valid partial
topology would silently disagree with the API/Engine process about publication,
subscription, consumer-group, or stream identity.

Introduce explicit protocol-catalog, deployment-manifest, and process-host-plan
representations. Exact type and package names are implementation choices, but
the ownership rules are not:

- stable publication and logical-subscription identities are shared protocol;
- physical stream, group, and mailbox-routing identity is selected once for a
  deployment and consumed consistently by every process;
- a host plan declares only the publishers and subscriptions that role serves;
- each process binds only its local component instances;
- process validation requires handlers for every subscription assigned to that
  host; and
- deployment validation requires every enabled logical subscription to be
  assigned to a role and every physical route to be well formed.

The embedded deployment still compiles to one host plan with all handlers. The
remote deployment compiles to at least an API/Engine host plan and a Worker host
plan. It does not toggle one universal graph with `worker: "remote"`,
`hostsWorker`, or optional dependency bags.

Use the second host to promote the current HTTP-specific topology toward a
Worker-job protocol catalog. Keep the current CloudEvent message types until a
second protocol supplies evidence for broader schemas; the immediate goal is
to stop physical routes and logical subscription identities from being defined
as though every Worker capability must become its own stream. Any identity
migration must be atomic across producers, consumers, tests, and deployment
configuration.

Model Observability as one explicit logical subscription capable of selecting
multiple catalog publications and feed it through one serial local ingestion
lane. Preserve the current independently admitted fanout to Engine and
Observability. Do not add wildcard subscriptions, make Observability a side
effect of Engine handling, or claim global Redis order across separate streams.
Choosing and hardening a single physical observation stream may become a later
Change once multi-route admission and recovery are designed; C20 must leave
that target representable.

This remains topology and host-binding work. It does not add delivery retry,
pending-entry reclaim, cancellation Messages, a general outbox, duplicate
terminal policy, or application process entry points.

**Completion evidence.**

- One shared deployment manifest can produce distinct, type-checked Engine and
  Worker host plans with identical route identity.
- A missing local handler fails process-plan validation, and an unassigned
  enabled subscription fails deployment validation.
- The existing `local-system` profile still hosts and routes the entire graph.
- Tests demonstrate independent Engine and Observability delivery while
  Observability consumes its selected publications through one serial local
  lane.
- No component imports topology, carrier, Redis, mailbox, consumer-group, or
  deployment-manifest mechanics.

## Change C21 - Give Worker truthful managed lifecycle and controlled ingress - not started

### Discussion

Worker is a long-lived autonomous component with real capacity and execution
state, so the remote process must not manage it through no-op lifecycle hooks.
Give the same Worker used by embedded and remote profiles meaningful
`start()`, `stop()`, and `health()` control. Its lifecycle state should express
whether it is accepting work, draining, or stopped, while preserving the
component's existing capacity and terminal-publication ownership.

Worker lifecycle and carrier lifecycle remain separate responsibilities.
Worker owns whether it accepts work and how its active executions settle. The
process host owns whether a subscription is polling or presenting deliveries.
Worker must not learn about Redis, consumer groups, mailboxes, or deployment
placement merely to coordinate those controls.

A truthful stop requires an ordered host policy rather than simply adding
methods to the class:

1. quiesce that host's Worker-command ingress so it presents no new work;
2. define honestly what happens to work already admitted or waiting for Worker
   capacity;
3. let active work reach its chosen finish-or-cancel boundary while terminal
   publication remains available;
4. stop Worker only after the executions covered by that policy settle; and
5. stop remaining messaging egress and infrastructure dependencies afterward.

The current managed runtime provides ordered start and reverse-order stop, but
the current router groups publication and several subscription loops into one
resource. C20's host-binding split supplies the right point to decide whether a
Worker subscription becomes an independently controlled managed ingress or
whether shared lifecycle needs an explicit quiesce/drain phase. Do not claim a
graceful drain while an embedded terminal consumer can stop before a draining
Worker publishes its result.

Redis entries not yet presented may remain in Redis for a later process; an
in-process carrier has no durable equivalent. C21 must state and test the
minimum common stop guarantee and each carrier's stronger behavior rather than
making the local carrier imitate Redis recovery. A delivery refused because
Worker is no longer accepting must not be silently acknowledged as successful.

Local Worker health reports only the component instance this process owns.
Whether a separately deployed Worker process is reachable or whether enough
Worker instances exist is deployment health, not a fake remote
`ManagedResource<Worker>` inside an Engine or gateway process.

Keep this Change independent of the new app and deployment proof. It should be
exercised through the existing embedded profile over both carriers first, then
the Worker-host profile in C22 can consume an already truthful lifecycle.

**Completion evidence.**

- The retained Worker instance exposes tested accepting, draining/stopping,
  stopped, and health behavior rather than no-op symmetry methods.
- Both local-system carrier branches start Worker before its command ingress
  and stop new ingress before Worker settles active work.
- Terminal publication needed by settling work remains available for the
  duration promised by the stop contract.
- Redis work not yet presented follows an explicit retained-entry policy, and
  in-process admitted work follows an explicit ephemeral policy.
- The `local-system` profile includes Worker as a real managed resource, while
  profiles that do not host Worker include no remote placeholder resource.
- Worker remains free of carrier, topology, deployment, and process-supervisor
  dependencies.

## Change C22 - Run and prove a separately deployed Worker host - not started

### Discussion

Add `apps/worker-host` as a real deployable package with an app-local process
profile. It constructs the Worker and its required first-party collaborators,
selects Redis-backed Message delivery, and selects the shared artifact and SQL
infrastructure needed to resolve inputs and publish outputs that the Engine can
observe from another process. It must not import the complete local-system
profile or install unrelated Engine, app-service, Observability, Replay, or
Limiter graphs through a convenience package.

The other side of the proof is a companion API/Engine process profile using the
same deployment definition and shared Redis, S3/MinIO, and Postgres identities.
Its exact app-local or shared location should follow the same promotion rule as
the Worker profile; it must not be expressed by constructing a hidden Worker
and marking it remote. The existing local HTTP server and CLI profiles remain
supported.

Both process entry points own configuration parsing, lifecycle start and
rollback, signals, application of C21's stop contract, process identity, and
truthful readiness for the resources they require. Deployment configuration
makes shared protocol and physical-route values one source of truth rather than
parallel environment-variable conventions.

The acceptance proof runs at least the two application processes against real
Redis, MinIO/S3-compatible storage, and Postgres. Submit one HTTP JSON job to the
API/Engine side, observe the Worker consume it with no in-process Worker
instance, persist and retrieve its shared artifacts, consume the terminal
Message back at Engine, and reach the expected completed run state. The proof
must fail if the Worker host is absent or misconfigured instead of succeeding
through a local fallback.

Inspect the built or `pnpm deploy` dependency closure for each app and record
which unexpected production dependencies remain. Split a broad provider
package only when that evidence shows a material deployable cost or coupling;
the Worker legitimately needs the three remote infrastructure implementations.

The first remote deployment does not need to solve every distributed-systems
policy. Cancellation across the boundary, crash recovery and pending-entry
reclaim, idempotent redelivery, retained failures, full lifecycle-event
migration, and the final single-stream observability design remain separately
scoped unless the acceptance proof cannot be truthful without one of them.

**Completion evidence.**

- `apps/worker-host` builds and deploys independently with no complete-system
  profile dependency.
- API/Engine and Worker processes load compatible values from one deployment
  definition and report truthful startup failure for unreachable required
  infrastructure.
- A real end-to-end flow crosses Redis in both directions and shares artifacts
  and SQL state through MinIO/S3 and Postgres, with no in-process Worker
  fallback.
- The existing embedded profile and its lightweight filesystem, SQLite, and
  in-process branches remain green.
- The recorded deployable dependency inventories either justify the current
  provider package boundary or create a concrete follow-on Change to narrow it.

**Deliberately deferred beyond this Arc.**

- General migration of Engine, Limiter, Replay, Observability, and component
  lifecycle event families off `EventBusPort`.
- A cancellation protocol that replaces the in-process `AbortSignal` path.
- Production Redis delivery hardening: retries, reclaim, retention, poison
  handling, idempotency, and duplicate terminal policy.
- Atomic fanout or reconciliation for work and observation routes, and the
  final physical design for one globally ordered observation lane.
- Dynamic provider plugins and per-job backend selection.
- A general startup-time component-placement compiler. The explicit profiles
  in this Arc remain compatible presets, but the broader configuration and
  validation surface is deliberately distant work; see the
  [deferred design sketch](../research/configurable-component-placement.md).
- Hot relocation of components after a process has started.
