// import { CapId } from "../../flow/map.js";
// import { JobHttpJsonData } from "../job/data.js";
// import { DomainActionDescriptor } from "../shared/otel-attributes.js";
// import { EmbedDescriptor, EmbedMcpData } from "./data.js";
// export type DomainActionNoDataDescriptor<
//   Domain extends string,
//   Action extends string
// > = {
//   domain: Domain;
//   action: Action;
//   entity: undefined;
// };
// export type EmbedEventMap = {
//   "embed.queued": DomainActionDescriptor<"embed", "queued", EmbedDescriptor>;
//   "embed.submitted": DomainActionDescriptor<
//     "embed",
//     "submitted",
//     EmbedDescriptor
//   >;
// };

// export type EmbedEventType = keyof EmbedEventMap;

// export type EmbedOtelAttributesMap = {
//   [T in EmbedEventType]: Omit<EmbedEventMap[T], "data">;
// };

// export type JobQueuedType = Extract<EmbedEventType, `${string}.queued`>;

// export type EmbedDataFor<C extends CapId> = C extends keyof EmbedDataMap
//   ? EmbedDataMap[C]
//   : never;

// export type EmbedDataMap = {
//   mcp: EmbedMcpData;
//   httpjson: JobHttpJsonData;
// };

// const a = {
//   embed: {
//     id: "",
//   },
//   url: "",
//   transport: "http",
//   feature: {
//     primitive: "tool",
//     name: "",
//   },
// } satisfies EmbedDataFor<"mcp">;
