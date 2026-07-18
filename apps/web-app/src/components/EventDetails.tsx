import type { AnyEvent, AnyScope } from "@lcase/types";
import { CodeEditor } from "./CodeEditor";
import type { OpenInMainPanel } from "./MainPanelTypes";
import { Button } from "./ui/button";
import { Maximize2Icon } from "lucide-react";

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
  flowid: "text-neutral-600 dark:text-neutral-400",
  flowversionid: "text-neutral-600 dark:text-neutral-400",
  jobid: "",
  limiterid: "",
  runid: "text-neutral-600 dark:text-neutral-400",
  schedulerid: "",
  stepid: "",
  steptype: "",
  toolid: "",
  workerid: "",
} satisfies Record<keyof AnyEvent | keyof AnyScope, string>;

const fieldOrder = [
  "id",
  "flowid",
  "flowversionid",
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
  onOpenInMainPanel,
}: {
  event: AnyEvent | null;
  index?: string;
  onOpenInMainPanel?: OpenInMainPanel;
}) {
  if (!event)
    return <div>Select an event in the event graph to view its details.</div>;

  async function openEvent(title: string, event: AnyEvent) {
    if (onOpenInMainPanel === undefined) return;
    onOpenInMainPanel(title, JSON.stringify(event, null, 2), "json");
  }
  return (
    <div className="event-expanded text-sm mt-1 font-mono text-start p-1 rounded-xl mb-2 ">
      <p className="mb-2 text-lg">
        {index && "#" + index}
        {event.type}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => openEvent(`${event.type}`, event)}
          title="Open output in main tab"
        >
          <Maximize2Icon className="size-3.5" />
        </Button>
      </p>

      {fieldOrder.map((key, index) => {
        if (!Object.hasOwn(event, key)) return;
        return (
          <div
            key={index + event.id}
            className={getFieldColor(key) + " flex justify-start text-xs"}
          >
            <div className="w-[10rem]">[{key}]</div>
            <div>{String(event[key as keyof AnyEvent])}</div>
          </div>
        );
      })}

      <p className="mt-3 mb-2 text-lg">Data</p>
      <CodeEditor
        key={event.id}
        value={JSON.stringify(event.data, null, 2)}
        language="json"
        readOnly
        autoHeight
      />
      <pre className="flex flex-col text-start text-xs dark:text-sky-200 text-sky-700">
        {}
      </pre>
    </div>
  );
}
