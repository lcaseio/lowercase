import type { ECElementEvent, EChartsOption } from "echarts";
import EChartsReact from "echarts-for-react";
import type { TopLevelFormatterParams } from "echarts/types/src/component/tooltip/TooltipModel.js";
import { useMemo, useState } from "react";
import type { AnyEvent } from "@lcase/types";

export type EventGraphProps = {
  events: AnyEvent[];
  selectedEventId: string | null;
  onEventClick: (eventId: string) => void;
};

type DataPoint = {
  time: number;
  index: number;
  label: string;
  eventId: string;
};
type Dim = keyof DataPoint;

export function EventGraph({
  events,
  selectedEventId,
  onEventClick,
}: EventGraphProps) {
  /**
   * old way to create events array, no longer used, here for reference.
   */

  // const eventsArr = useMemo(() => {
  //   if (!runId) return [];

  //   const arr = runEventIds[runId]?.length ? [...runEventIds[runId]] : [];
  //   if (arr.length === 0) return [];
  //   return arr.sort(
  //     (a, b) =>
  //       new Date(allEvents[a].time).getTime() -
  //       new Date(allEvents[b].time).getTime(),
  //   );
  // }, [runId, runEventIds, allEvents]);

  /**
   * transitioning from data (array) to object format per point, but both
   * here because both are still used, eventually object format will
   * only be used.
   */
  const data = useMemo(
    () =>
      events.map((e, index) => [
        new Date(e.time).getTime(),
        index,
        e.type as string,
        e.id,
      ]),
    [events],
  );

  const dataObject = useMemo(
    () =>
      events.map(
        (e, index) =>
          ({
            time: new Date(e.time).getTime(),
            index,
            label: e.type as string,
            eventId: e.id,
          }) satisfies DataPoint,
      ),
    [events],
  );

  const times = data.map((d) => d[0] as number);
  const minTime = times.length ? Math.min(...times) : 0;
  const maxTime = times.length ? Math.max(...times) : 1;

  // may want to store this in state in the future to preserve zoom range when
  // switching tabs/pages
  const [zoomRange, setZoomRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 100 });

  const option: EChartsOption = {
    animation: true,
    animationDurationUpdate: 300,
    animationEasingUpdate: "cubicOut",
    dataset: {
      dimensions: ["time", "index", "label", "eventId"],
      source: dataObject,
    },
    tooltip: {
      trigger: "item",

      formatter: (params: TopLevelFormatterParams) => {
        const p = Array.isArray(params) ? params[0] : params;
        if (!isEventPoint(p.data)) return "";
        const point = p.data;
        const { time, index, label, eventId } = point;
        const t = new Date(time).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const eventDetails = `id: ${eventId}<br/>`;
        const eventSource = `source: ${events[index].source}<br/>`;
        const eventData = `data:<br/><textarea cols="80" rows="10" wrap="hard" class="font-mono text-[0.7rem]/3 whitespace-pre-wrap wrap-break-word">${JSON.stringify(events[index].data, null, 2)}</textarea><br/>`;
        return (
          `#${index} - ${label}<br/>${t}<br/>` +
          eventDetails +
          eventSource +
          eventData
        );
      },
    },

    grid: [
      { left: 50, right: 80, top: 20, bottom: 180 },
      { left: 56, right: 80, height: 98, bottom: 25 },
    ],
    xAxis: [
      {
        type: "time",
        name: "Time",
        axisLabel: {
          formatter: (val) =>
            new Date(val).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
        },
        axisPointer: {
          type: "line", // "line" | "shadow" | "cross"
          lineStyle: {
            type: "dashed", // makes it dotted
            width: 1,
          },
        },
      },
      {
        type: "time",
        gridIndex: 1,
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "Order",
        inverse: true,
        axisLabel: {
          formatter: (val) => `#${Math.floor(val)}`,
        },
        min: "dataMin",
        max: "dataMax",
        splitLine: { show: false },
        interval: 1,
        minInterval: 1,
      },
      {
        type: "value",
        gridIndex: 1,
        min: 0,
        max: 1,
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      {
        type: "slider",
        realtime: true,

        xAxisIndex: 0,
        height: 100,
        bottom: 30,
        filterMode: "filter",
        fillerColor: "rgba(16, 185, 129, 0.15)",

        borderColor: "#334155",
        backgroundColor: "rgba(0,0,0,0)",
        handleStyle: {
          color: "#666",
          shadowBlur: 4,
          shadowColor: "rgba(0,0,0,0.5)",
          borderColor: "#555",
        },

        moveHandleSize: 6,
        moveHandleStyle: {
          color: "#555",
          opacity: 0.9,
        },
        handleSize: 50,
        dataBackground: {
          lineStyle: {
            type: "solid",
            shadowColor: "red",
            color: "red",
          },
        },
      },
      {
        type: "inside",
        realtime: true,
        xAxisIndex: 0,
        filterMode: "filter",
      },
    ],

    series: [
      {
        type: "custom",
        name: "events",
        universalTransition: true,

        xAxisIndex: 0,
        yAxisIndex: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem: (_params: any, api) => {
          const value = (d: Dim) => api.value(d);
          const timeVal = value("time");
          const index = value("index");
          const label = value("label");
          const point = api.coord([timeVal, index]);
          const eventId = value("eventId");
          if (!point) return null;

          // const range = zoomRange ?? { start: minTime, end: maxTime };
          const startTime =
            minTime + (zoomRange.start / 100) * (maxTime - minTime);
          const endTime = minTime + (zoomRange.end / 100) * (maxTime - minTime);

          const span = endTime - startTime;
          const pct = span > 0 ? ((timeVal as number) - startTime) / span : 0;
          const flip = pct >= 0.8;
          const gap = 6 + baseLabelSize / 2;
          const time = new Date(timeVal).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return {
            type: "group",
            id: "g-" + point[3],
            children: [
              {
                type: "circle",
                id: "c-" + point[3],
                shape: {
                  cx: point[0],
                  cy: point[1],
                  r: Math.max(1, baseLabelSize / 3),
                },
                style: {
                  fill:
                    events[Number(index)]?.action === "failed"
                      ? "#d3344a"
                      : "#34d399",
                },
              },
              {
                type: "text",
                id: "t-" + point[3],
                style: {
                  x: flip ? point[0] - gap : point[0] + gap,
                  y: point[1],
                  text: flip
                    ? `{time|${time}} {label|${label}}`
                    : `{label|${label}} {time|${time}}`,
                  fill: "#e2e8f0",
                  textAlign: flip ? "right" : "left",
                  textVerticalAlign: "middle",
                  rich: {
                    label: {
                      fontSize: baseLabelSize,
                      fill:
                        selectedEventId === eventId
                          ? "oklch(94.5% 0.129 101.54)"
                          : "#e2e8f0",
                    },
                    time: {
                      fontSize: Math.max(4, baseLabelSize - 1),
                      fill: "#94a3b8",
                    },
                  },
                },
              },
            ],
          };
        },
      },
      {
        type: "bar",
        data: data.map((d) => [d[0], 1]),
        xAxisIndex: 1,
        yAxisIndex: 1,
        barWidth: 1,
        itemStyle: {
          color: "#34d399",
        },
        silent: true,
      },
    ],
  };

  // sotring data zoom into state in order to flip labels far on the positive x
  // axis, and to scale font based on visible events.
  const onDataZoom = (params: {
    start: number;
    end: number;
    batch?: Array<{ start: number; end: number }>;
  }) => {
    const event = params.batch?.[0] ?? params;
    setZoomRange({ start: event.start, end: event.end });
  };

  const onChartClick = (params: ECElementEvent) => {
    if (!isEventPoint(params.data)) return;
    const { eventId } = params.data;
    if (!eventId) return;

    onEventClick(eventId);
  };

  const visibleCount = useMemo(() => {
    if (!data.length) return 0;
    const times = data.map((d) => d[0] as number);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const span = maxTime - minTime || 1;
    const startTime = minTime + (zoomRange.start / 100) * span;
    const endTime = minTime + (zoomRange.end / 100) * span;
    const left = lowerBound(times, startTime);
    const right = upperBound(times, endTime) - 1;
    return right >= left ? right - left + 1 : 0;
  }, [data, zoomRange.start, zoomRange.end]);

  const baseLabelSize =
    visibleCount === 0
      ? 10
      : visibleCount > 100
        ? 5
        : visibleCount > 70
          ? 8
          : visibleCount > 50
            ? 10
            : visibleCount > 40
              ? 11
              : visibleCount > 20
                ? 12
                : visibleCount > 10
                  ? 14
                  : 15;
  return (
    <div className="w-full h-full">
      <EChartsReact
        option={option}
        onEvents={{ datazoom: onDataZoom, click: onChartClick }}
        style={{ height: "100%", width: "100%" }}
        className="p-4 bg-neutral-800 dark:bg-neutral-800"
      />
    </div>
  );
}

function lowerBound(numbers: number[], target: number): number {
  let low = 0;
  let high = numbers.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (numbers[mid] < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

function upperBound(numbers: number[], target: number): number {
  let low = 0;
  let high = numbers.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (numbers[mid] <= target) low = mid + 1;
    else high = mid;
  }
  return low;
}

function isEventPoint(data: unknown): data is DataPoint {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.time === "number" &&
    typeof d.index === "number" &&
    typeof d.label === "string" &&
    typeof d.eventId === "string"
  );
}
