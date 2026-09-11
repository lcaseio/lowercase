import type { EventType } from "@lcase/types";
import type { CompleteList, Publication } from "@lcase/ports";

/**
 * Declares a publication whose list of Message types *is* its contract.
 *
 * The `const` type parameter keeps the literals from widening to `string[]`,
 * so the resulting `Publication` carries the exact tuple and every consumer --
 * publishers, handler signatures -- derives its union from that one value.
 * Nothing can drift, because there is no second declaration to drift from.
 *
 * Lives in runtime rather than `packages/ports` because ports is types-only,
 * and outside `in-process/` because declaring topology is carrier-agnostic:
 * a log-backed carrier consumes the same declarations.
 */
export function definePublication<const Types extends readonly EventType[]>(
  publication: Publication<Types>,
): Publication<Types> {
  return publication;
}

/**
 * Declares a publication against an already-authoritative union, requiring the
 * list to cover it exactly.
 *
 * Use this when the union is the contract and the publication must implement
 * it -- the named union can then be shared with handler and publisher
 * signatures, so one rename moves everything together. Omitting a member fails
 * with an error naming the missing type; including a type outside the union
 * fails on the offending element.
 *
 * Curried because TypeScript cannot partially infer type arguments: `All` is
 * supplied explicitly while `Listed` is still inferred from the value.
 */
export function definePublicationFor<All extends EventType>() {
  return <const Listed extends readonly All[]>(
    publication: {
      readonly id: string;
      readonly types: Listed;
    } & CompleteList<All, Listed>,
  ): Publication<Listed> => publication;
}
