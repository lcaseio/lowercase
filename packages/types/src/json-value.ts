export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [I in string]: JsonValue };
