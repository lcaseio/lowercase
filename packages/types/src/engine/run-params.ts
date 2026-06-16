import type { JsonValue } from "../json-value.js";

type Param = string;
export type RunParams = Record<Param, { hash?: string; value?: JsonValue }>;
