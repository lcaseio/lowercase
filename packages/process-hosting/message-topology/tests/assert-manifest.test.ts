import { describe, expect, it } from "vitest";
import { assertManifest } from "../src/assert-manifest.js";
import type { MessagingManifest } from "../src/manifest.js";
import {
  syntheticCatalog,
  syntheticDeployment,
  requests,
  outcomes,
  engineRequests,
  auditAll,
  reporterOutcomes,
} from "./helpers/synthetic-deployment.js";

// Every case starts from a manifest that passes and breaks exactly one thing,
// so a failure names the rule that caught it rather than the first rule to run.
const broken = (change: Partial<MessagingManifest>): MessagingManifest => ({
  ...syntheticDeployment,
  ...change,
});

const reject = (manifest: MessagingManifest): string => {
  try {
    assertManifest(syntheticCatalog, manifest);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected assertManifest to reject this manifest");
};

describe("assertManifest", () => {
  it("accepts a complete deployment", () => {
    expect(() =>
      assertManifest(syntheticCatalog, syntheticDeployment),
    ).not.toThrow();
  });

  it("rejects an identity the catalog never declared", () => {
    expect(
      reject(broken({ topicIds: [requests.id, outcomes.id, "invented.v1"] })),
    ).toContain("catalog does not declare");
  });

  it("rejects a subscription whose selected topic is not enabled", () => {
    // auditAll spans both topics, so disabling one leaves it half-connected --
    // a consumer that looks wired and silently never hears about outcomes.
    expect(
      reject(
        broken({
          topicIds: [requests.id],
          routes: syntheticDeployment.routes.filter(
            (r) => r.topicId === requests.id,
          ),
        }),
      ),
    ).toContain("that topic is not enabled");
  });

  it("rejects an enabled edge bound to no route", () => {
    expect(
      reject(
        broken({
          routes: syntheticDeployment.routes.filter(
            (r) => r.subscriptionId !== auditAll.id,
          ),
        }),
      ),
    ).toContain("binds it to no route");
  });

  it("rejects a route for an edge the catalog does not describe", () => {
    // reporterOutcomes never selects the requests topic, so this route
    // describes a delivery that cannot happen.
    expect(
      reject(
        broken({
          routes: [
            ...syntheticDeployment.routes,
            {
              topicId: requests.id,
              subscriptionId: reporterOutcomes.id,
              routeId: requests.id,
            },
          ],
        }),
      ),
    ).toContain("is not a delivery edge");
  });

  it("rejects the same edge routed twice", () => {
    expect(
      reject(
        broken({
          routes: [
            ...syntheticDeployment.routes,
            {
              topicId: requests.id,
              subscriptionId: engineRequests.id,
              routeId: "somewhere-else.v1",
            },
          ],
        }),
      ),
    ).toContain(
      "routes 'synthetic-requests.v1 -> synthetic-engine.requests.v1' more than once",
    );
  });

  it("rejects a subscription assigned to no role", () => {
    expect(
      reject(
        broken({
          roles: syntheticDeployment.roles.map((role) => ({
            ...role,
            consumesFrom: role.consumesFrom.filter((s) => s !== auditAll.id),
          })),
        }),
      ),
    ).toContain("assigns it to no role");
  });

  it("rejects a subscription assigned to two roles", () => {
    expect(
      reject(
        broken({
          roles: syntheticDeployment.roles.map((role) =>
            role.id === "synthetic-gateway-host"
              ? { ...role, consumesFrom: [auditAll.id] }
              : role,
          ),
        }),
      ),
    ).toContain("exactly one role consumes each");
  });

  it("rejects a duplicate role id", () => {
    expect(
      reject(
        broken({
          roles: [
            ...syntheticDeployment.roles,
            { id: "synthetic-cli-host", publishesTo: [], consumesFrom: [] },
          ],
        }),
      ),
    ).toContain("declares role 'synthetic-cli-host' more than once");
  });

  it("rejects a topic no role may publish", () => {
    // Nothing structural stops this: the topic is enabled, routed, and
    // consumed. It is simply a conversation that can never start.
    expect(
      reject(
        broken({
          roles: syntheticDeployment.roles.map((role) => ({
            ...role,
            publishesTo: role.publishesTo.filter((t) => t !== outcomes.id),
          })),
        }),
      ),
    ).toContain("no role permission to publish it");
  });
});
