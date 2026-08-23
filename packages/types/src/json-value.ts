export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonValue =
  null | boolean | number | string | JsonValue[] | JsonObject;

// A top-level JSON shape, checked one level deep only -- nested content is
// just `unknown`, not recursively validated. Used for fields that are
// "some JSON blob, we don't care about its exact internal shape" (e.g.
// StepHttpJson.body), where the real "is this valid JSON" guarantee already
// comes from the surrounding flow definition's own JSON.parse succeeding at
// all, not from deep structural typing here.
export type ShallowJsonValue =
  null | boolean | number | string | unknown[] | Record<string, unknown>;
