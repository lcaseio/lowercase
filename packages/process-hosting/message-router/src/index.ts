/**
 * Generic Message router hosting: the two carriers, the mailbox machinery
 * behind the local one, and the topology checks both share.
 *
 * Named for what it hosts rather than for messaging in general, because Message
 * *types* are not here. The envelope lives in `@lcase/types`, the publication,
 * subscription, publisher and handler contracts live in `@lcase/ports`, and one
 * product's protocol declarations live with the profile that owns them. What is
 * here is the delivery mechanism.
 *
 * It imports both of those packages for types only, so its production
 * dependency closure is empty. That is deliberate: a process hosting one
 * component must be able to install a carrier without installing Engine,
 * Worker, application services, Observability, or any concrete adapter.
 *
 * The log-backed carrier names `MessageLogPort` and never a Redis client. A
 * profile hands it a factory that opens whatever connection it wants, which is
 * what keeps this package free of a `redis` dependency.
 */
export * from "./define-publication.js";
export * from "./delivery.types.js";
export * from "./message-router.js";
export * from "./in-process/in-process-message-router.js";
export * from "./redis/redis-message-router.js";
