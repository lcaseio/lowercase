import { AnyEvent } from "@lcase/types";

type RunScopedEvent = AnyEvent & { runid: string };
export function hasRunId(event: AnyEvent): event is RunScopedEvent {
  const e = event as unknown as Record<string, unknown>;
  return typeof e.runid === "string";
}
