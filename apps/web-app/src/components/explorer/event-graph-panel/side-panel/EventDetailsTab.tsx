import type { AnyEvent } from "@lcase/types";
import { EventDetails } from "@/components/EventDetails";

// "Open in main panel" has no dockview equivalent yet -- same stubbed no-op
// StepResultsTab/StepDetailsTab use. See docs/todo.md.
export function EventDetailsTab({
  event,
  index,
}: {
  event: AnyEvent | null;
  index?: string;
}) {
  return (
    <EventDetails event={event} index={index} onOpenInMainPanel={() => {}} />
  );
}
