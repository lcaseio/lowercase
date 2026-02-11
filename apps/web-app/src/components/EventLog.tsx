import { useAppSelector } from "../redux/typed-hooks";
import { EventBar } from "./EventBar";

export function EventLog({ runId }: { runId?: string }) {
  const events = useAppSelector((state) => state.events.events);
  const runEventIds = useAppSelector((state) => state.events.runEventIds);
  const panels = useAppSelector((state) => state.runner.eventPanels);
  console.log(runId);
  return (
    <div className="w-[600px] h-[900px] mt-18 ">
      {panels[1] !== undefined
        ? runEventIds[panels[1]]?.map((id) => <p>{id}</p>)
        : ""}
      <p>{Object.entries(events).length}</p>
      {Object.entries(events).map((value) => (
        <EventBar event={value[1]} />
      ))}
    </div>
  );
}
