import type {
  CloudScope,
  ConcurrencyScope,
  ConcurrencyOtelAttributesMap,
  ConcurrencyEventType,
  ConcurrencyEventData,
  ConcurrencyEvent,
} from "@lcase/types";
import type { OtelContext } from "../types.js";
import { BaseEmitter } from "./base.emitter.js";
import { EventBusPort } from "@lcase/ports";
import { concurrencyOtelAttributesMap } from "../registries/concurrency/otel.map.js";
import { eventSchemaRegistry } from "../registries/event-schema.registry.js";

/**
 * strongly typed scoped emitter for engine events.
 * @see EmitterFactory for general usage with it
 *
 * registry should move out.
 */
export class ConcurrencyEmitter extends BaseEmitter {
  protected otel: OtelContext;
  protected concurrencyOtelAttributesMap: ConcurrencyOtelAttributesMap;
  #concurrencyScope: ConcurrencyScope;

  constructor(
    private readonly bus: EventBusPort,
    scope: OtelContext & ConcurrencyScope & CloudScope,
    private internal: boolean = false
  ) {
    const { traceId, spanId, traceParent, source } = scope;
    const { concurrencyid } = scope;

    super({ traceId, spanId, traceParent }, { source });

    this.otel = { traceId, spanId, traceParent };
    this.#concurrencyScope = { concurrencyid };
    this.concurrencyOtelAttributesMap = concurrencyOtelAttributesMap;
    this.bus = bus;
  }

  async emit<T extends ConcurrencyEventType>(
    type: T,
    data: ConcurrencyEventData<T>
  ): Promise<ConcurrencyEvent<T>> {
    const event = {
      ...this.envelopeHeader(),
      ...this.#concurrencyScope,
      data,
      type,
      domain: this.concurrencyOtelAttributesMap[type].domain,
      action: this.concurrencyOtelAttributesMap[type].action,
      ...(this.concurrencyOtelAttributesMap[type].entity
        ? { entity: this.concurrencyOtelAttributesMap[type].entity }
        : {}),
    } satisfies ConcurrencyEvent<T>;

    const entry = eventSchemaRegistry[type];
    const result = entry.schema.event.safeParse(event);
    if (result.error) {
      throw new Error(
        `[concurrency-emitter] error parsing event; ${type}; ${result.error}`
      );
    }
    await this.bus.publish(type, event, { internal: this.internal });
    return event;
  }
}
