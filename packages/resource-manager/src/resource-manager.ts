import type { EventBusPort } from "@lcase/ports/bus";
import type { EmitterFactoryPort } from "@lcase/ports/events";
import type { ResourceManagerPort } from "@lcase/ports/resource-manager";
import type { QueuePort } from "@lcase/ports";

export type ResourceManagerDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  queue: QueuePort;
};

export class ResourceManager implements ResourceManagerPort {
  #bus: EventBusPort;
  #ef: EmitterFactoryPort;
  #queue: QueuePort;
  constructor(deps: ResourceManagerDeps) {
    this.#bus = deps.bus;
    this.#ef = deps.ef;
    this.#queue = deps.queue;
  }
}
