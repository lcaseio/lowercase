import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDetails } from "@/components/EventDetails";
import { FileTextIcon, TerminalSquareIcon } from "lucide-react";
import type { AnyEvent } from "@lcase/types";
import type { FlowVersionRunDetailsTab } from "@/redux/slices/flow-version-run-slice";

type Props = {
  activeDetailsTab: FlowVersionRunDetailsTab;
  onActiveDetailsTabChange: (tab: FlowVersionRunDetailsTab) => void;
  selectedEvent: AnyEvent | null;
  selectedStepId: string | null;
};

export function FlowVersionRunDetailsPanel({
  activeDetailsTab,
  onActiveDetailsTabChange,
  selectedEvent,
  selectedStepId,
}: Props) {
  return (
    <Tabs
      value={activeDetailsTab}
      onValueChange={(v) =>
        onActiveDetailsTabChange(v as FlowVersionRunDetailsTab)
      }
      className="h-full flex flex-col"
    >
      <TabsList variant="line">
        <TabsTrigger value="eventDetails">
          <FileTextIcon />
          Event Details
        </TabsTrigger>
        <TabsTrigger value="stepOutput">
          <TerminalSquareIcon />
          Step Output
        </TabsTrigger>
      </TabsList>
      <TabsContent value="eventDetails" className="ml-3 mr-3">
        <EventDetails event={selectedEvent} />
      </TabsContent>
      <TabsContent value="stepOutput" className="ml-3 mr-3">
        {selectedStepId ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Step "{selectedStepId}" output -- coming soon.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Click a step in the graph to see its run output.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
