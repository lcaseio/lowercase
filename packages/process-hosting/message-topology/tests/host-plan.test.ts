import { describe, expect, it } from "vitest";
import { hostPlanFor } from "../src/host-plan.js";
import { remoteWorker } from "../src/deployments/remote-worker.deployment.js";
import { localSystemInProcess } from "../src/deployments/local-system.deployment.js";
import { syntheticDeployment } from "./helpers/synthetic-deployment.js";

describe("hostPlanFor", () => {
  // The asymmetry the whole arc rests on: Worker holds the terminal topic's
  // route so it can publish, and the list of who consumes those terminals
  // appears nowhere in its plan.
  it("gives the worker host its own conversation and no knowledge of the other end", () => {
    const plan = hostPlanFor(remoteWorker, "worker-host");

    expect(plan.publishesTo).toEqual([
      { topicId: "job-terminal.v1", routeIds: ["job-terminal.v1"] },
    ]);
    expect(plan.consumesFrom).toEqual([
      {
        subscriptionId: "worker.job-command.v1",
        topicRoutes: [{ topicId: "job-command.v1", routeId: "job-command.v1" }],
      },
    ]);

    expect(JSON.stringify(plan)).not.toContain("api-engine-observer-host");
    expect(JSON.stringify(plan)).not.toContain("engine.job-terminal.v1");
  });

  it("gives the companion host the two subscriptions that are not worker's", () => {
    const plan = hostPlanFor(remoteWorker, "api-engine-observer-host");

    expect(plan.consumesFrom.map((s) => s.subscriptionId)).toEqual([
      "engine.job-terminal.v1",
      "observability.job.v1",
    ]);
    // Observability is one subscription reading both routes, which is what
    // keeps a command and the terminal it produced on one delivery lane.
    expect(
      plan.consumesFrom.find((s) => s.subscriptionId === "observability.job.v1")
        ?.topicRoutes,
    ).toEqual([
      { topicId: "job-command.v1", routeId: "job-command.v1" },
      { topicId: "job-terminal.v1", routeId: "job-terminal.v1" },
    ]);
  });

  // Both halves of the split derive from one manifest rather than each
  // authoring its own, so agreeing on route identity is structural.
  it("derives the same route for an edge from either side of a split", () => {
    const worker = hostPlanFor(remoteWorker, "worker-host");
    const companion = hostPlanFor(remoteWorker, "api-engine-observer-host");

    const published = worker.publishesTo.find(
      (p) => p.topicId === "job-terminal.v1",
    );
    const consumed = companion.consumesFrom
      .flatMap((s) => s.topicRoutes)
      .filter((r) => r.topicId === "job-terminal.v1");

    expect(consumed.every((r) => published?.routeIds.includes(r.routeId))).toBe(
      true,
    );
  });

  it("gives the embedded deployment's single role the whole graph", () => {
    const plan = hostPlanFor(localSystemInProcess, "local-system");

    expect(plan.carrier).toBe("in-process");
    expect(plan.publishesTo.map((p) => p.topicId)).toEqual([
      "job-command.v1",
      "job-terminal.v1",
    ]);
    expect(plan.consumesFrom).toHaveLength(3);
  });

  it("plans a role that consumes nothing", () => {
    const plan = hostPlanFor(syntheticDeployment, "synthetic-gateway-host");

    expect(plan.consumesFrom).toEqual([]);
    expect(plan.publishesTo).toEqual([
      { topicId: "synthetic-requests.v1", routeIds: ["synthetic-requests.v1"] },
    ]);
  });

  it("names the roles it does know when asked for one it does not", () => {
    expect(() => hostPlanFor(remoteWorker, "observer-host")).toThrow(
      /declares no role 'observer-host'.*worker-host/s,
    );
  });
});
