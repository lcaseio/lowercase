import type { EventType } from "@lcase/types";
import type { MessageHandler } from "./message-handler.js";

/**
 * A declared route a producer is allowed to publish onto, and the exact list of
 * Message types it accepts. Runtime owns these values; components receive only
 * a publisher already bound to one of them.
 *
 * Parameterised on the *list* rather than on the union it forms, so the union
 * is derived from the declared value instead of being asserted alongside it.
 * A `types: readonly T[]` shape would only require each element to be a member
 * of `T` -- never that the list covers `T` -- so a publication could promise
 * more at compile time than it accepted at runtime. Build these with
 * `definePublication`/`definePublicationFor` rather than annotating by hand.
 */
export type Publication<
  Types extends readonly EventType[] = readonly EventType[],
> = {
  id: string;
  types: Types;
};

/** The union of Message types a publication carries. */
export type PublicationTypes<P extends Publication> = P["types"][number];

/**
 * Requires `Listed` to cover every member of `All`.
 *
 * Resolves to `unknown` (a no-op in an intersection) when the list is
 * complete, and otherwise to an object carrying the missing members, so the
 * compiler error names exactly what was left out.
 */
export type CompleteList<
  All extends EventType,
  Listed extends readonly All[],
> = [Exclude<All, Listed[number]>] extends [never]
  ? unknown
  : { readonly __missingEventTypes__: Exclude<All, Listed[number]> };

/**
 * A stable delivery purpose attached to one publication -- each logical
 * subscription independently receives every Message published there.
 *
 * The id names durable topology, not one process boot or one handler instance,
 * so it can later map to a local mailbox or a Redis consumer group without
 * changing what it means.
 */
export type LogicalSubscription<
  Types extends readonly EventType[] = readonly EventType[],
> = {
  id: string;
  publication: Publication<Types>;
};

/**
 * One hosted subscription: the purpose plus the handler this process runs for
 * it. `maxInFlight` bounds how many of that subscription's handlers may be
 * running at once, defaulting to 1 (FIFO starts and completions).
 *
 * It is deliberately per-subscription rather than shared across a component's
 * subscriptions -- a component-wide capacity group is a later feature, and
 * naming one here would imply serialization this does not provide.
 */
export type MessageBinding<
  Types extends readonly EventType[] = readonly EventType[],
> = {
  subscription: LogicalSubscription<Types>;
  handler: MessageHandler<Types[number]>;
  maxInFlight?: number;
};
