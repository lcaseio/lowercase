import EChartsReact from "echarts-for-react";
import { RunnerFlowSelector } from "../components/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";
import { useAppSelector } from "../redux/typed-hooks";
import type { EChartsOption } from "echarts";
import type { TopLevelFormatterParams } from "echarts/types/dist/shared";
import { useMemo, useState } from "react";
import { MonitorTabs } from "@/components/MonitorTabs";

export function Runner() {
  const events = useAppSelector((state) => state.events.events);

  const eventsArr = useMemo(() => {
    const arr = Object.values(events);
    return arr.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
  }, [events]);

  const data = useMemo(
    () =>
      eventsArr.map((e, index) => [
        new Date(e.time).getTime(),
        index,
        e.type as string,
        e.id,
      ]),
    [eventsArr],
  );

  const times = data.map((d) => d[0] as number);
  const minTime = times.length ? Math.min(...times) : 0;
  const maxTime = times.length ? Math.max(...times) : 1;

  const [zoomRange, setZoomRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 100 });
  // const [visibleCount, setVisibleCount] = useState(data.length);

  const option: EChartsOption = {
    animation: true,
    animationDurationUpdate: 300,
    animationEasingUpdate: "cubicOut",
    tooltip: {
      trigger: "item",

      formatter: (params: TopLevelFormatterParams) => {
        const p = Array.isArray(params) ? params[0] : params;
        const point = p.data as [number, number, string];
        const [time, idx, label] = point;
        const t = new Date(time).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return `#${idx} - ${label}<br/>${t}`;
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
        universalTransition: true,
        data,
        xAxisIndex: 0,
        yAxisIndex: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem: (_params: any, api) => {
          const timeVal = api.value(0);
          const idx = api.value(1);
          const label = api.value(2);
          const point = api.coord([timeVal, idx]);
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
                style: { fill: "#34d399" },
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
                      fill: "#e2e8f0",
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

  const onDataZoom = (params: {
    start: number;
    end: number;
    batch?: Array<{ start: number; end: number }>;
  }) => {
    // zoom "settled" — do your label flipping / font changes now
    const event = params.batch?.[0] ?? params;
    // const span = maxTime - minTime || 1;
    // const startTime = minTime + (event.start / 100) * span;
    // const endTime = minTime + (event.end / 100) * span;
    setZoomRange({ start: event.start, end: event.end });

    // if (!times.length) {
    //   setVisibleCount(0);
    //   return;
    // }
    // const left = lowerBound(times, startTime);
    // const right = upperBound(times, endTime) - 1;
    // setVisibleCount(right >= left ? right - left + 1 : 0);
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
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runner</h2>
        <MonitorTabs />
        <div className="flex justify-between">
          <RunnerFlowSelector />
        </div>
        <div className="w-[900px] h-[700px] mb-10 bg-slate-800 caret-blue-500 rounded">
          <EChartsReact
            option={option}
            onEvents={{ datazoom: onDataZoom }}
            style={{
              height: "100%",
              width: "100%",
              background: "#13293d",
            }}
            className="p-4"
          />
        </div>
      </Main>
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
