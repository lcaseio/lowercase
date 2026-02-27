import type { AnyEvent, AnyScope } from "@lcase/types";

function getFieldColor(field: string) {
  const f = field as keyof AnyEvent;
  return fieldColors[f];
}

const fieldColors = {
  id: "text-slate-700 dark:text-slate-200",
  source: "text-pink-700 dark:text-pink-300",
  specversion: "text-pink-800 dark:text-pink-300",
  time: "text-pink-800 dark:text-pink-300",
  type: "",
  subject: "text-pink-800 dark:text-pink-300",
  datacontenttype: "",
  dataschema: "",
  data: "",
  domain: "dark:text-teal-300 text-teal-700",
  entity: "dark:text-teal-300 text-teal-700",
  action: "dark:text-teal-300 text-teal-700",
  traceparent: "dark:text-purple-300 text-purple-700",
  tracestate: "",
  traceid: "dark:text-purple-300 text-purple-700",
  spanid: "dark:text-purple-300 text-purple-700",
  parentspanid: "",
  capid: "",
  engineid: "",
  flowid: "",
  jobid: "",
  limiterid: "",
  runid: "",
  schedulerid: "",
  stepid: "",
  steptype: "",
  toolid: "",
  workerid: "",
} satisfies Record<keyof AnyEvent | keyof AnyScope, string>;

const fieldOrder = [
  "id",
  "flowid",
  "runid",
  "stepid",
  "jobid",
  "toolid",
  "engineid",
  "capid",
  "limiterid",
  "schedulerid",
  "workerid",
  "time",
  "source",
  "subject",
  "specversion",
  "traceid",
  "spanid",
  "parentspanid",
  "traceparent",
  "tracestate",
  "domain",
  "entity",
  "action",
  "datacontenttype",
  "dataschema",
] as const satisfies (keyof AnyEvent | keyof AnyScope)[];

export function EventDetails({
  event,
  index,
}: {
  event: AnyEvent | null;
  index?: string;
}) {
  if (!event)
    return <div>Select an event in the event graph to view its details.</div>;
  return (
    <div className="event-expanded text-sm mt-1 font-mono text-start p-1 rounded-xl mb-2 ">
      <p className="mb-2 text-lg">
        {index && "#" + index}
        {event.type}
      </p>

      {fieldOrder.map((key) => {
        if (!Object.hasOwn(event, key)) return;
        return (
          <div className={getFieldColor(key) + " flex justify-start"}>
            <div className="w-[8rem]">[{key}]</div>
            <div>{String(event[key as keyof AnyEvent])}</div>
          </div>
        );
      })}

      <p className="mt-3 mb-2 text-lg">data</p>
      <pre className="flex flex-col text-start text-sm dark:text-sky-200 text-sky-700">
        {JSON.stringify(event.data, null, 2)}
      </pre>
    </div>
  );
}
