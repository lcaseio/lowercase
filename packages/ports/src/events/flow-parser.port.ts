import { FlowEvent } from "@lcase/types";

export type FlowQueuedParsed = {
  event: FlowEvent<"flow.queued">;
  error: unknown;
};

export type FlowSubmittedParsed = {
  event: FlowEvent<"flow.queued">;
  error: unknown;
};
export interface FlowParserPort {
  flowQueued(event: FlowEvent<"flow.queued">): FlowQueuedParsed;
  flowQueued(event: FlowEvent<"flow.submitted">): FlowSubmittedParsed;
}
