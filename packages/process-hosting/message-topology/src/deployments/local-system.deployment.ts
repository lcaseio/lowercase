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
 * The complete embedded deployment: one role hosting the whole job
 * conversation.
 *
 * It is still a deployment with a role rather than a special case without one.
 * The embedded graph is what a single-role manifest looks like, which is what
 * keeps the split deployments from being a different kind of thing.
 *
 * This preset cannot prove how many OS processes an operator launched. It
 * describes one role hosting everything; running two copies of it is an
 * operational mistake that topology data has no way to see.
 */
export const localSystemRole: MessagingRole = {
  id: "local-system",
  publishesTo: [jobCommandTopic.id, jobTerminalTopic.id],
  consumesFrom: [
    workerJobCommandSubscription.id,
    engineJobTerminalSubscription.id,
    observabilityJobSubscription.id,
  ],
};

/**
 * One route per topic, with the route ID equal to the topic ID.
 *
 * That equality is not decoration. The Redis carrier derives its stream key
 * from the topic ID today, so keeping them identical means adopting routes
 * changes no stream keys and strands no existing consumer group. C23 is what
 * first gives one topic a second route ID.
 */
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

const base = {
  topicIds: [jobCommandTopic.id, jobTerminalTopic.id],
  subscriptionIds: [
    workerJobCommandSubscription.id,
    engineJobTerminalSubscription.id,
    observabilityJobSubscription.id,
  ],
  routes,
  roles: [localSystemRole],
} as const;

/**
 * Two presets over one role and route base, because the carrier is a property
 * of the deployment rather than of the process.
 *
 * Running the embedded graph over Redis genuinely is a different deployment:
 * same roles, same logical conversation, different infrastructure to stand up.
 * The alternative -- one manifest with the carrier left out -- would mean the
 * manifest could not answer the one question every host has to agree on.
 */
export const localSystemInProcess: MessagingManifest = {
  ...base,
  id: "local-system-in-process",
  carrier: "in-process",
};

export const localSystemRedis: MessagingManifest = {
  ...base,
  id: "local-system-redis",
  carrier: "redis-streams",
};
