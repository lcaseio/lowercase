import { useAppSelector } from "../redux/typed-hooks";
import { EventBar } from "./EventBar";

export function EventLog() {
  const events = useAppSelector((state) => state.events.events);
  return (
    <div className="w-[600px] h-[900px] mt-18 ">
      <p>{Object.entries(events).length}</p>
      {Object.entries(events).map((value) => (
        <EventBar event={value[1]} />
      ))}
    </div>
  );
}
