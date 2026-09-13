import { describe, expect, it } from "vitest";
import { assertCatalog } from "../src/catalog.js";
import { assertManifest } from "../src/assert-manifest.js";
import { jobCatalog } from "../src/catalogs/job.catalog.js";
import {
  localSystemInProcess,
  localSystemRedis,
} from "../src/deployments/local-system.deployment.js";
import { remoteWorker } from "../src/deployments/remote-worker.deployment.js";
import {
  syntheticCatalog,
  syntheticDeployment,
} from "./helpers/synthetic-deployment.js";

describe("shipped deployments", () => {
  it("declares a valid job catalog", () => {
    expect(() => assertCatalog(jobCatalog)).not.toThrow();
  });

  it.each([
    ["local-system-in-process", localSystemInProcess],
    ["local-system-redis", localSystemRedis],
    ["remote-worker", remoteWorker],
  ])("validates %s against the job catalog", (_name, manifest) => {
    expect(() => assertManifest(jobCatalog, manifest)).not.toThrow();
  });

  // Four roles, one of them serving nothing. The real deployments have at most
  // two roles and one conversation, so without this the representation would be
  // untested beyond the arrangement that motivated it.
  it("validates a four-role deployment including a role that consumes nothing", () => {
    expect(() =>
      assertManifest(syntheticCatalog, syntheticDeployment),
    ).not.toThrow();
    expect(syntheticDeployment.roles).toHaveLength(4);
    expect(
      syntheticDeployment.roles.filter((r) => r.consumesFrom.length === 0),
    ).toHaveLength(2);
  });

  // Route IDs equal topic IDs everywhere today, which is what lets C22 adopt
  // routes without changing a single Redis stream key or stranding a consumer
  // group. C23 is what first breaks this equality, deliberately.
  it.each([
    ["local-system-redis", localSystemRedis],
    ["remote-worker", remoteWorker],
  ])(
    "routes every %s edge to a route named for its topic",
    (_name, manifest) => {
      for (const route of manifest.routes) {
        expect(route.routeId).toBe(route.topicId);
      }
    },
  );

  // The two carrier variants differ in exactly one field. If they ever drift,
  // the embedded graph would mean something different depending on how it was
  // configured, which is precisely what one shared manifest exists to prevent.
  it("keeps both embedded variants identical apart from the carrier", () => {
    const { id: _a, carrier: inProcess, ...restA } = localSystemInProcess;
    const { id: _b, carrier: redis, ...restB } = localSystemRedis;

    expect(restA).toEqual(restB);
    expect([inProcess, redis]).toEqual(["in-process", "redis-streams"]);
  });

  // assertManifest cannot make this claim: a manifest that simply forgot to
  // enable a topic is internally consistent, just smaller than the catalog.
  // "Complete embedded graph" is a claim about the embedded deployment
  // specifically, so it is asserted where it is made.
  it("enables the whole catalog in the embedded deployment", () => {
    expect([...localSystemInProcess.topicIds].sort()).toEqual(
      jobCatalog.topics.map((t) => t.id).sort(),
    );
    expect([...localSystemInProcess.subscriptionIds].sort()).toEqual(
      jobCatalog.subscriptions.map((s) => s.id).sort(),
    );
  });

  // A split deployment is only meaningful if the two roles are genuinely
  // disjoint. Overlap here would mean two processes racing for the same
  // subscription without the manifest saying so.
  it("splits remote-worker responsibilities with no overlap", () => {
    const served = remoteWorker.roles.flatMap((r) => r.consumesFrom);
    expect(new Set(served).size).toBe(served.length);
    expect(served).toHaveLength(remoteWorker.subscriptionIds.length);
  });
});
