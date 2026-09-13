import {
  jobCommandTopic,
  jobTerminalTopic,
  workerJobCommandSubscription,
  engineJobTerminalSubscription,
  observabilityJobSubscription,
} from "../catalogs/job.catalog.js";
import type {
  DeliveryRoute,
  MessagingManifest,
  MessagingRole,
} from "../manifest.js";

/**
 * The transitional split: Worker in its own process, everything else together.
 *
 * Named for what it hosts. Calling it a companion or a main host would mean
 * the name stops being true the moment a later deployment splits Engine out,
 * and the whole point of the role layer is that such a deployment is a
 * different manifest rather than a variant of this one.
 *
 * It publishes commands and never terminals, and consumes from the two subscriptions
 * that are not Worker's. Nothing here names the Worker host; the two agree by
 * sharing routes, not by referring to each other.
 */
export const apiEngineObserverHost: MessagingRole = {
  id: "api-engine-observer-host",
  publishesTo: [jobCommandTopic.id],
  consumesFrom: [
    engineJobTerminalSubscription.id,
    observabilityJobSubscription.id,
  ],
};

/**
 * The Worker host: consumes commands, publishes terminals, and holds no other
 * Message responsibility.
 *
 * This is the asymmetry the whole arc rests on. Worker needs the terminal
 * topic's identity and route to publish onto it, and never the list of who
 * consumes it. That is what lets Engine and Observability read those terminals
 * from another process without Worker knowing either exists.
 */
export const workerHost: MessagingRole = {
  id: "worker-host",
  publishesTo: [jobTerminalTopic.id],
  consumesFrom: [workerJobCommandSubscription.id],
};

// One route per topic, route ID equal to topic ID, matching the embedded
// presets. Both hosts derive the same stream keys from this one source rather
// than agreeing by convention.
const routes: readonly DeliveryRoute[] = [
  {
    topicId: jobCommandTopic.id,
    subscriptionId: workerJobCommandSubscription.id,
    routeId: jobCommandTopic.id,
  },
  {
    topicId: jobCommandTopic.id,
    subscriptionId: observabilityJobSubscription.id,
    routeId: jobCommandTopic.id,
  },
  {
    topicId: jobTerminalTopic.id,
    subscriptionId: engineJobTerminalSubscription.id,
    routeId: jobTerminalTopic.id,
  },
  {
    topicId: jobTerminalTopic.id,
    subscriptionId: observabilityJobSubscription.id,
    routeId: jobTerminalTopic.id,
  },
];

/**
 * Redis only. An in-process carrier cannot realize this manifest, because a
 * host serving Worker's subscription would be delivering to lanes the other
 * host owns. C22 is what makes a carrier refuse it rather than seal an
 * object graph that silently drops half the deployment.
 */
export const remoteWorker: MessagingManifest = {
  id: "remote-worker",
  carrier: "redis-streams",
  topicIds: [jobCommandTopic.id, jobTerminalTopic.id],
  subscriptionIds: [
    workerJobCommandSubscription.id,
    engineJobTerminalSubscription.id,
    observabilityJobSubscription.id,
  ],
  routes,
  roles: [apiEngineObserverHost, workerHost],
};
