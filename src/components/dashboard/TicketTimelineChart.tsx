"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TimelinePoint = {
  date: string;
  count: number;
};

type Props = {
  data: TimelinePoint[];
  timezoneLabel: string;
};

export default function TicketTimelineChart({ data, timezoneLabel }: Props) {
  const chartConfig = useMemo(() => {
    const series = [
      {
        name: "Tickets",
        data: data.map((point) => ({
          x: point.date,
          y: point.count,
        })),
      },
    ];

    const options: ApexOptions = {
      chart: {
        type: "area",
        height: 320,
        toolbar: { show: false },
        fontFamily: "Outfit, sans-serif",
      },
      stroke: { curve: "smooth", width: 4, colors: ["#34d399"] },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [0, 90, 100],
          colorStops: [],
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        type: "datetime",
        labels: {
          style: { colors: "#94a3b8" },
          datetimeFormatter: {
            year: "yyyy",
            month: "MMM dd",
            day: "MMM dd",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: "#94a3b8" } },
      },
      grid: {
        yaxis: { lines: { show: true } },
      },
      tooltip: {
        x: { format: "MMM dd" },
        y: {
          formatter: (val: number) => `${val} tickets`,
        },
      },
    };

    return { series, options };
  }, [data]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ticket Activity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Daily ticket volume (last {data.length || 0} days, {timezoneLabel})
        </p>
      </div>

      {data.length ? (
        <div className="mt-6 flex-1">
          <ReactApexChart options={chartConfig.options} series={chartConfig.series} type="area" height={360} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Tickets haven&apos;t been updated yet. Activity will show here automatically.
        </div>
      )}
    </div>
  );
}
